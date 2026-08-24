# Environment and Stage 0C Build Audit

Audit date: **2026-08-24**

Scope: **Phase 0, Stage 0A environment audit and Stage 0C build preparation**.
The audit and build used safe local inspection. The approved Microsoft .NET 9 SDK
was installed. No STS2 save files, game files, or installed mods were modified.
Godot was not installed, BaseLib was not installed into STS2, and STS2 was not
launched.

## Environment

| Item | Result | Evidence or note |
|---|---|---|
| Operating system | Microsoft Windows 11 Pro, 64-bit | Version 10.0.26200, build 26200 |
| Current working directory | C:\Codex\STS2CharacterCreator | Reported by Get-Location |
| Git | 2.49.0.windows.1 | git --version |
| .NET SDK | 9.0.317 | Installed as Microsoft.DotNet.SDK.9, SDK path C:\Program Files\dotnet\sdk\9.0.317\ |
| Steam installation path | C:\Program Files (x86)\Steam | Detected from Steam registry entries |
| Steam library containing STS2 | D:\SteamLibrary | Detected in libraryfolders.vdf |
| STS2 installation path | D:\SteamLibrary\steamapps\common\Slay the Spire 2 | Matched Steam app manifest appmanifest_2868840.acf |
| sts2.dll | D:\SteamLibrary\steamapps\common\Slay the Spire 2\data_sts2_windows_x86_64\sts2.dll | Found by recursive search within the detected game directory |
| STS2 mods directory | D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods | Directory exists and was inventoried before and after the build |
| BaseLib status | Not detected in live STS2 mods | No BaseLib-named file or directory was found in the live game tree or mods tree |
| BaseLib version in STS2 | Undetected | No live BaseLib installation was found |
| BaseLib build package | 3.2.1 restored from NuGet | This did not install BaseLib into STS2 |
| Godot executable | Not found on PATH | Get-Command godot,godot4 returned no commands |
| STS2 version identifiers | sts2.dll ProductVersion 0.1.0+41cef1ea4657c524aa50e870df009e56337e8c32; assembly version 0.1.0.0; Steam build ID 24724944 | SlayTheSpire2.exe reports ProductVersion/FileVersion 1.0.0.0. These are local file and Steam build identifiers. No different public release number is inferred. |

## Stage 0B and Git checkpoint

- Initial baseline commit: ed350f410efcbd189292d8aad5b4b793d42b7836
- Stage 0B documentation commit: e66e7862848a0b0731e885da3a932f36a277c5f6
- BLANK pinned commit: d29b6c8aeacae7f68685e3e9c3f5d65fa88bdb80
- The parent repository has no configured remote.
- The BLANK checkout is ignored by the parent and remained clean.

## Stage 0C build result

- .NET restore succeeded with exit code 0.
- Normal dotnet build exited with code 1.
- The diagnostic errors-only build also exited with code 1.
- The build reported 5 errors and 242 warnings.
- The errors are CS0115 override mismatches against the installed STS2 assembly.
- No BLANK artifacts were produced.
- The live STS2 mods inventory was identical before and after the build attempt.
- The BlankTheSpire directory did not exist before or after the build.
- Stage 0D was not started.

The complete evidence is in docs/research/BLANK_BUILD.md.

## Missing prerequisites and blockers

- A BLANK source revision compatible with the installed STS2 API, or an explicitly authorized later source adaptation.
- External Godot availability remains untested because C# compilation failed first. Godot was not installed.
- BaseLib is available to the build through the restored NuGet package, but is not installed into the live STS2 mods directory.
- The current build did not reach PCK packaging, so PCK generation remains unproven.

## Exact commands used

Repository checkpoint and inspection:

~~~powershell
git status --short --branch
git diff --check
git diff --name-only
git diff --stat
git add docs/STATUS.md docs/research/BLANK_RUNTIME.md docs/research/THIRD_PARTY.md
git commit -m "docs: complete BLANK runtime audit"
git log -2 --format='%H%n%s'
~~~

SDK inspection and installation:

~~~powershell
winget --version
winget show Microsoft.DotNet.SDK.9
winget install --id Microsoft.DotNet.SDK.9 --exact --accept-source-agreements --accept-package-agreements
dotnet --version
dotnet --list-sdks
dotnet --info
~~~

Sandbox and safety inspection:

~~~powershell
Get-ChildItem -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods' -Recurse -Force
Test-Path -LiteralPath 'D:\SteamLibrary\steamapps\common\Slay the Spire 2\mods\BlankTheSpire'
git check-ignore -v research/build-output/blank-mods research/build-output/blank-mods/.probe
git -C research/upstream/BLANKthespire rev-parse HEAD
git -C research/upstream/BLANKthespire status --short --branch
~~~

Build commands, run from research/upstream/BLANKthespire/mod:

~~~powershell
dotnet restore .\BlankTheSpire.csproj -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
dotnet build .\BlankTheSpire.csproj -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
dotnet build .\BlankTheSpire.csproj --no-restore -clp:ErrorsOnly -p:Sts2Path="D:/SteamLibrary/steamapps/common/Slay the Spire 2" -p:ModsPath="C:/Codex/STS2CharacterCreator/research/build-output/blank-mods/"
~~~

The original Stage 0A read-only commands remain documented in the earlier
environment audit record.

## Uncertainty

- The STS2 DLL ProductVersion and Steam build ID are reliable local identifiers,
  but this audit did not map them to a separate public marketing release label.
- BaseLib may exist outside the detected STS2 installation, but no such location
  is part of the detected STS2 mod setup. It remains undetected, not proven
  absent everywhere on the machine.
- Godot command lookup is not a full-disk absence proof, but no Godot executable
  was available on PATH and no installation was attempted.
- The restore/build generated ignored upstream metadata under .godot. Git reports
  the pinned upstream source checkout as clean.
