resource "aws_vpc" "app" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app.id
}

resource "aws_subnet" "blue" {
  vpc_id            = aws_vpc.app.id
  cidr_block        = local.blue_cidr
  availability_zone = data.aws_availability_zones.available.names[0]
}

resource "aws_subnet" "green" {
  vpc_id            = aws_vpc.app.id
  cidr_block        = local.green_cidr
  availability_zone = data.aws_availability_zones.available.names[2]
}

resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.app.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "blue" {
  subnet_id      = aws_subnet.blue.id
  route_table_id = aws_route_table.rtb_public.id
}

resource "aws_route_table_association" "green" {
  subnet_id      = aws_subnet.green.id
  route_table_id = aws_route_table.rtb_public.id
}
