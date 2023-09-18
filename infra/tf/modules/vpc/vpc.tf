resource "aws_vpc" "app" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app.id
}

resource "aws_subnet" "production" {
  vpc_id            = aws_vpc.app.id
  cidr_block        = local.production_cidr
  availability_zone = data.aws_availability_zones.available.names[0]
}

resource "aws_subnet" "staging" {
  vpc_id            = aws_vpc.app.id
  cidr_block        = local.staging_cidr
  availability_zone = data.aws_availability_zones.available.names[2]
}

resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.app.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "production" {
  subnet_id      = aws_subnet.production.id
  route_table_id = aws_route_table.rtb_public.id
}

resource "aws_route_table_association" "staging" {
  subnet_id      = aws_subnet.staging.id
  route_table_id = aws_route_table.rtb_public.id
}
