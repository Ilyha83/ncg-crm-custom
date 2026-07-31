import subprocess
import re
import time

print("Starting public SSH tunnel for NCG CRM...")
proc = subprocess.Popen(
    ["ssh", "-o", "StrictHostKeyChecking=no", "-R", "80:localhost:8090", "nokey@localhost.run"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)

for line in iter(proc.stdout.readline, ''):
    print(line, end="")
    if "lh.life" in line or "lhr.life" in line or "localhost.run" in line:
        match = re.search(r'https://[a-zA-Z0-9.-]+\.(?:lhr\.life|lh\.life)', line)
        if match:
            print("\n=========================================")
            print("YOUR PUBLIC CRM TUNNEL URL:")
            print(match.group(0))
            print("=========================================\n")
