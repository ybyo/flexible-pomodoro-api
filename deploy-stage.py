import os
from os.path import join, dirname
from pathlib import PureWindowsPath
import time
import boto3
import paramiko
from dotenv import load_dotenv
from datetime import datetime
import subprocess

start_time = time.time()

dotenv_path = join(dirname(__file__), 'env', '.aws.env')
load_dotenv(dotenv_path)

# Credentials
access_key = os.environ['ACCESS_KEY']
secret_access_key = os.environ['SECRETE_ACCESS_KEY']
region_name = os.environ['REGION_NAME']
key_pair = os.environ['KEY_PAIR']

# Environment
docker_tag = os.environ['DOCKER_TAG']

# Instances
ec2_frontend_dns = os.environ['INSTANCE_FRONTEND_DOMAIN']
ec2_backend_dns = os.environ['INSTANCE_BACKEND_DOMAIN']
instance_ids = [os.environ['INSTANCE_FRONTEND_ID'], os.environ['INSTANCE_BACKEND_ID']]
instance_domain = [os.environ['INSTANCE_FRONTEND_DOMAIN'], os.environ['INSTANCE_BACKEND_DOMAIN']]

# Paths
remote_project_dir = os.environ['REMOTE_PROJECT_DIR']
compose_file_path = os.environ['COMPOSE_FILE_PATH']

# Host username
cmd_username = os.environ['CMD_USERNAME']

ssm_client = boto3.client('ssm', region_name=region_name, aws_access_key_id=access_key,
                          aws_secret_access_key=secret_access_key)

try:
#     os.system(f"docker system prune -af --volumes")
    # Build Docker Compose files in local
    os.system(
        f"docker compose -f compose-web.yml --env-file ./env/.{docker_tag}.env build --no-cache")

    for idx, instance_id in enumerate(instance_ids):
        response = ssm_client.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunShellScript',
            Parameters={'commands': [
                f'sudo -u {cmd_username} mkdir -p {remote_project_dir}/flexible-pomodoro-front/env',
                f'sudo -u {cmd_username} mkdir -p {remote_project_dir}/flexible-pomodoro-front/certs',
                f'sudo -u {cmd_username} mkdir -p {remote_project_dir}/flexible-pomodoro-api/env',
                f'sudo -u {cmd_username} mkdir -p {remote_project_dir}/flexible-pomodoro-api/certs',
                f'sudo -u {cmd_username} NODE_ENV={docker_tag} docker compose -f {remote_project_dir}/flexible-pomodoro-api/compose-web.yml --env-file {remote_project_dir}/flexible-pomodoro-api/env/.{docker_tag}.env down',
                f'sudo -u {cmd_username} docker system prune -af --volumes',
            ]},
        )

        command_id = response['Command']['CommandId']

        time.sleep(10)

        output = ssm_client.get_command_invocation(
            CommandId=command_id,
            InstanceId=instance_id,
        )
        print(f"{output['StandardErrorContent']}")

        if instance_id == os.environ['INSTANCE_FRONTEND_ID']:
            print(f'Cleaning frontend...')
        else:
            print(f'Cleaning backend...')

        # Connect to EC2 instance
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(instance_domain[idx], username=cmd_username, key_filename='flexible-pomodoro-all.pem')
        scp = ssh.open_sftp()

        local_files = ['compose-web.yml',
                       f'env/.{docker_tag}.env',
                       f'certs/127.0.0.1-cert.pem',
                       f'certs/127.0.0.1-key.pem',
                       f'../flexible-pomodoro-front/env/.{docker_tag}.env',
                       ]

        for local_file in local_files:
            local_file_abs = join(os.getcwd(), local_file)
            remote_file = ''

            remote_file_path1 = remote_project_dir + '/flexible-pomodoro-front/' + PureWindowsPath(
                local_file).as_posix()
            remote_file_path2 = remote_project_dir + '/flexible-pomodoro-api/' + PureWindowsPath(local_file).as_posix()

            scp.put(local_file_abs, remote_file_path1)
            scp.put(local_file_abs, remote_file_path2)

        if instance_id == os.environ['INSTANCE_FRONTEND_ID']:
            print(f'Transferring the built Docker image to Frontend...')
        else:
            print(f'Transferring the built Docker image to Backend...')

        commands = []
        if instance_id == os.environ['INSTANCE_FRONTEND_ID']:
            local_command = f"docker save nginx | bzip2 | ssh -i 'flexible-pomodoro-all.pem' ubuntu@{ec2_frontend_dns} docker load"
            proc = subprocess.Popen(local_command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE, shell=True, universal_newlines=True)
            out, err = proc.communicate()

            if "Are you sure you want to continue connecting" in out:
                proc.stdin.write("yes\n")
                proc.stdin.flush()
                out, err = proc.communicate()

            commands = [
                f'sudo -u {cmd_username} docker compose -f {remote_project_dir}/flexible-pomodoro-api/compose-web.yml --env-file {remote_project_dir}/flexible-pomodoro-api/env/.{docker_tag}.env up --no-build nginx',
            ]

        elif instance_id == os.environ['INSTANCE_BACKEND_ID']:
            local_command = f"docker save backend | bzip2 | ssh -i 'flexible-pomodoro-all.pem' ubuntu@{ec2_backend_dns} docker load"
            proc = subprocess.Popen(local_command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE, shell=True, universal_newlines=True)
            out, err = proc.communicate()

            if "Are you sure you want to continue connecting" in out:
                proc.stdin.write("yes\n")
                proc.stdin.flush()
                out, err = proc.communicate()

            commands = [
                f'sudo -u {cmd_username} docker compose -f {remote_project_dir}/flexible-pomodoro-api/compose-web.yml --env-file {remote_project_dir}/flexible-pomodoro-api/env/.{docker_tag}.env up --no-build backend',
            ]

        # Run Docker Compose in EC2
        if instance_id == os.environ['INSTANCE_FRONTEND_ID']:
            print(f'Starting Docker image in Frontend...')
        else:
            print(f'Starting Docker image in Backend...\n')

        try:
            response = ssm_client.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': commands},
            )

        except Exception as e:
            print(f'Error occurred: {e}')

        ssh.close()
    print('Docker Compose files are successfully deployed on EC2 instances.')
    end_time = time.time()
    elapsed_time = end_time - start_time
    print('Elapsed: {:.1f}s'.format(elapsed_time))
    print(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

except Exception as e:
    print(f'Error occurred: {e}')
