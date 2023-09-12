resource "aws_vpc" "app" {
  cidr_block           = local.cidr_vpc
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app.id
}

resource "aws_subnet" "public1" {
  vpc_id            = aws_vpc.app.id
  cidr_block        = local.cidr_subnet1
  availability_zone = data.aws_availability_zones.available.names[0]
}

resource "aws_subnet" "public2" {
  vpc_id            = aws_vpc.app.id
  cidr_block        = local.cidr_subnet2
  availability_zone = data.aws_availability_zones.available.names[1]
}

resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.app.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "rta_subnet_public1" {
  subnet_id      = aws_subnet.public1.id
  route_table_id = aws_route_table.rtb_public.id
}

resource "aws_route_table_association" "rta_subnet_public2" {
  subnet_id      = aws_subnet.public2.id
  route_table_id = aws_route_table.rtb_public.id
}
