# Environment Audit

Audit date: **2026-08-24**

Scope: **Phase 0, Stage 0A only**. This was a read-only local audit. No dependencies were installed, BLANK was not cloned, no application framework was initialized, and no STS2 game files, saves, or installed mods were modified.

## Environment

| Item | Result | Evidence or note |
|---|---|---|
| Operating system | Microsoft Windows 11 Pro, 64-bit | Version 10.0.26200, build 26200 |
| Current working directory | C:\Codex\STS2CharacterCreator | Reported by Get-Location |
| Git | 2.49.0.windows.1 | git --version |
| .NET SDKs | **None detected** | dotnet --version reported that no SDKs were found. dotnet --list-sdks returned no entries. |
| Steam installation path | C:\Program Files (x86)\Steam | Detected from Steam registry entries |
| Steam library containing STS2 | D:\SteamLibrary | Detected in libraryfolders.vdf |
| STS2 installation path | D:\SteamLibrary\steamapps\common\Slay the Spire 2 | Matched Steam app manifest appmanifest_2868840.acf |
| sts2.dll | D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll | Found by recursive search within the detected game directory |
| STS2 mods directory | D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods | Directory exists and was inspected read-only |
| BaseLib status | **Not detected** | No BaseLib-named file or directory, DLL, or text metadata reference was found under the detected STS2 installation or its mods directory |
| BaseLib version | Undetected | No BaseLib installation was found from which to read a version |
| STS2 version identifiers | sts2.dll ProductVersion 0.1.0+41cef1ea4657c524aa50e870df009e56337e8c32; assembly version 0.1.0.0; Steam build ID 24724944 | SlayTheSpire2.exe reports ProductVersion/FileVersion 1.0.0.0. These are local file and Steam build identifiers. No different public release number is inferred. |

## Missing prerequisites

- A .NET SDK is not installed or otherwise available on PATH. The exact SDK version required by BLANK was not assessed because Stage 0B was not started.
- BaseLib was not detected in the installed STS2 game or mods tree. Its required version and compatibility are therefore unknown.
- BLANK source was intentionally not cloned, and its build prerequisites were intentionally not installed or evaluated in this stage.

No other prerequisite was assessed beyond the Stage 0A checks above.

## Exact commands used

Repository context was read with Get-Content -Raw -LiteralPath for the nine files specified in the task. The environment checks used these read-only commands and PowerShell inventory operations:

~~~powershell
Get-Location
Get-CimInstance Win32_OperatingSystem | Format-List Caption,Version,BuildNumber,OSArchitecture
git --version
dotnet --version
dotnet --list-sdks

Get-ItemProperty -LiteralPath 'HKCU:\Software\Valve\Steam'
Get-ItemProperty -LiteralPath 'HKLM:\SOFTWARE\Valve\Steam'
Get-ItemProperty -LiteralPath 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam'
Get-Content -Raw -LiteralPath 'C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf'
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps' -Filter 'appmanifest_*.acf' -File
Get-Content -Raw -LiteralPath 'D:\SteamLibrary\steamapps\appmanifest_2868840.acf'

Get-Item -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2'
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2' -Filter 'sts2.dll' -File -Recurse
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2' -Filter '*.exe' -File -Recurse
Get-Item -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\SlayTheSpire2.exe'
Get-Item -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll'
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods' -Force
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2' -Recurse -Force | Where-Object { $_.Name -match '(?i)baselib' }
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods' -Recurse -Filter '*.dll' -File -Force
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods' -Recurse -File -Force | Select-String -Pattern '(?i)baselib'
[System.Reflection.AssemblyName]::GetAssemblyName('D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll')
~~~

The Steam manifest inventory parsed the local name, installdir, and buildid fields from appmanifest_*.acf. File version metadata was read from SlayTheSpire2.exe and sts2.dll without loading or changing either file. Managed assembly metadata was read with System.Reflection.AssemblyName.

## Uncertainty

- The DLL ProductVersion and Steam build ID are reliable local identifiers for this installation, but this audit did not map them to a separate public marketing release label.
- BaseLib may exist outside the detected STS2 installation, but no such location is part of the detected STS2 mod setup. It remains undetected, not proven absent everywhere on the machine.
- The working directory is not recognized as a Git worktree by git status --short --branch; this did not prevent the requested audit or documentation changes.
- Upstream BLANK build requirements and runtime compatibility remain untested by design. That is Stage 0B/0C work.
