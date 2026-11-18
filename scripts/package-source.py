# This script creates the downloadable teaching source without private data or dependencies.
from pathlib import Path  # Resolve every source file relative to this project.
import json  # Remove the hosted Site identity from the reusable download.
import subprocess  # Ask Git for tracked and nonignored project files.
import zipfile  # Create a portable archive with no additional dependency.
root = Path(__file__).resolve().parent.parent  # Keep packaging independent of the caller's working directory.
result = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=root, text=True)  # Respect the project's secret and runtime exclusions.
files = sorted(set(result.splitlines()))  # Store each source file exactly once.
destination = root / 'public' / 'corelab-source.zip'  # Make the reviewed source downloadable from the private application.
with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:  # Compress the text-heavy study project efficiently.
    for name in files:  # Visit only the explicit project source inventory.
        if name == 'public/corelab-source.zip':  # Prevent recursive inclusion when regenerating this archive.
            continue  # Keep every archive a fresh, bounded source snapshot.
        path = root / name  # Resolve the current source file.
        if not path.is_file():  # Ignore removed paths that remain staged in Git.
            continue  # Continue with the available source inventory.
        if name == '.openai/hosting.json':  # Keep the local download reusable without linking it to the owner's live Site.
            manifest = json.loads(path.read_text())  # Preserve portable database hosting declarations.
            manifest.pop('project_id', None)  # Let a future hosted copy register its own identity.
            archive.writestr('corelab/' + name, json.dumps(manifest, indent=2) + '\n')  # Write the safe reusable hosting configuration.
        else:  # Copy ordinary source and documented configuration examples unchanged.
            archive.write(path, 'corelab/' + name)  # Keep the project under one tidy extraction directory.
print(f'Created {destination.name} ({destination.stat().st_size:,} bytes).')  # Report only the public artifact size.
