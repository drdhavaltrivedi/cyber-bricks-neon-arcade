#!/usr/bin/env python3
import json
import re
import os
import subprocess

def bump_version():
    manifest_path = "extension/manifest.json"
    popup_path = "extension/popup.html"
    
    if not os.path.exists(manifest_path):
        print(f"Error: {manifest_path} not found.")
        return None
        
    # 1. Read and parse manifest.json
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    old_version = data.get("version", "1.0.0")
    parts = old_version.split(".")
    if len(parts) == 3:
        parts[2] = str(int(parts[2]) + 1)
    else:
        parts[-1] = str(int(parts[-1]) + 1)
    new_version = ".".join(parts)
    
    # Update manifest data
    data["version"] = new_version
    
    # 2. Write manifest.json
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
        
    print(f"✔ Bumped manifest.json version from {old_version} to {new_version}")
    
    # 3. Update popup.html
    if os.path.exists(popup_path):
        with open(popup_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        old_pattern = f"BREAKOUT PROTOCOL v{old_version}"
        new_pattern = f"BREAKOUT PROTOCOL v{new_version}"
        
        if old_pattern in content:
            content = content.replace(old_pattern, new_pattern)
            with open(popup_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"✔ Updated version string in {popup_path}")
        else:
            # Try a regex fallback if the old version string wasn't exactly matched
            pattern = r"BREAKOUT PROTOCOL v\d+\.\d+\.\d+"
            if re.search(pattern, content):
                content = re.sub(pattern, new_pattern, content)
                with open(popup_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"✔ Updated version string (regex) in {popup_path}")
            else:
                print(f"⚠ Warning: Version string pattern not found in {popup_path}")
                
    return new_version

def build_zip():
    print("Building extension.zip...")
    # Remove existing zip
    if os.path.exists("extension.zip"):
        os.remove("extension.zip")
        
    # Run zip command in extension directory
    try:
        subprocess.run(
            ["zip", "-r", "../extension.zip", ".", "-x", ".*"],
            cwd="extension",
            check=True,
            stdout=subprocess.DEVNULL
        )
        print("✔ Successfully packaged extension.zip")
    except Exception as e:
        print(f"Error packaging zip: {e}")

def main():
    # Change cwd to project root if script is run from elsewhere
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    new_version = bump_version()
    if new_version:
        build_zip()
        print("\nRelease files updated successfully!")
        print("Next steps:")
        print(f"  git commit -am 'bump: version to {new_version}'")
        print("  git push")

if __name__ == "__main__":
    main()
