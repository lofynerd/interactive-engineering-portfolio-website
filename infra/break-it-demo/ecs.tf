# Dedicated ECS cluster + Fargate Spot service running the demo's
# self-healing target. The container itself is a trivial static health-check
# server — the point of the demo is ECS's own scheduler recovering from a
# stopped task, not the app logic.

resource "aws_ecr_repository" "demo_app" {
  name                 = "${local.name_prefix}-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  # A one-repo, one-purpose registry, isolated from any other project's images.
  tags = { Name = "${local.name_prefix}-app-ecr" }
}

resource "aws_ecr_lifecycle_policy" "demo_app" {
  repository = aws_ecr_repository.demo_app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the 5 most recent images to bound storage cost."
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = { type = "expire" }
      }
    ]
  })
}

resource "aws_ecs_cluster" "demo" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled" # keep cost minimal; not needed for a demo of this size
  }
}

resource "aws_ecs_cluster_capacity_providers" "demo" {
  cluster_name = aws_ecs_cluster.demo.name

  capacity_providers = ["FARGATE_SPOT", "FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
    base              = 0
  }
}

resource "aws_cloudwatch_log_group" "demo_task" {
  name              = "/ecs/${local.name_prefix}"
  retention_in_days = 14 # capped to avoid unbounded log storage cost
}

resource "aws_ecs_task_definition" "demo" {
  family                   = "${local.name_prefix}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256 # 0.25 vCPU — smallest Fargate size
  memory                   = 512 # 0.5 GB
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "demo-app"
      image     = "${aws_ecr_repository.demo_app.repository_url}:${var.demo_container_image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.demo_task.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "demo-app"
        }
      }
      environment = [
        { name = "PORT", value = "8080" }
      ]
    }
  ])
}

resource "aws_lb" "demo" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  # No access logs bucket configured — keeps this demo lean. Enable if you
  # want ALB-level request logs later.
  enable_deletion_protection = false

  tags = { Name = "${local.name_prefix}-alb" }
}

resource "aws_lb_target_group" "demo" {
  name        = "${local.name_prefix}-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.demo.id
  target_type = "ip" # required for awsvpc network mode

  health_check {
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200"
  }

  # Deregister quickly so a "broken" task disappears from the healthy count
  # fast, keeping the demo feeling responsive rather than sluggish.
  deregistration_delay = 15

  tags = { Name = "${local.name_prefix}-tg" }
}

resource "aws_lb_listener" "demo_http" {
  load_balancer_arn = aws_lb.demo.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.demo.arn
  }
}

resource "aws_ecs_service" "demo" {
  name            = "${local.name_prefix}-service"
  cluster         = aws_ecs_cluster.demo.id
  task_definition = aws_ecs_task_definition.demo.arn
  desired_count   = var.desired_task_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
    base              = 0
  }

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = true # no NAT gateway for this small demo — keeps cost down
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.demo.arn
    container_name   = "demo-app"
    container_port   = 8080
  }

  # Fast recovery: don't wait long before considering a replacement task
  # needed, so "break -> heal" feels snappy on camera.
  health_check_grace_period_seconds = 10

  # Deployment/scheduler settings tuned for a small, fast-recovering demo
  # rather than a zero-downtime rolling deployment (which doesn't apply
  # here — desired_count changes via the scale-to-zero scheduler, and
  # StopTask replacements are handled by the ECS scheduler automatically).
  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.demo_http]

  lifecycle {
    # The scale-to-zero/scale-up EventBridge Scheduler targets update the
    # desired_count directly via UpdateService — don't let Terraform fight
    # that by reverting it back to var.desired_task_count on every apply.
    ignore_changes = [desired_count]
  }
}
