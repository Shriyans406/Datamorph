@echo off
echo ======================================================
echo Antigravity IDE History Restorer
echo ======================================================
echo.
echo This script will restore your conversation history by copying
echo the global and workspace state databases from the old 
echo 'Antigravity' AppData to the new 'Antigravity IDE' AppData.
echo.
echo IMPORTANT: Please make sure Antigravity IDE is CLOSED before proceeding!
echo.
set /p confirm="Are you ready to restore history? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo Restoration cancelled.
    pause
    exit /b
)

echo.
echo Closing any running Antigravity IDE processes...
taskkill /IM "Antigravity IDE.exe" /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Backing up current state files...
copy "C:\Users\HP\AppData\Roaming\Antigravity IDE\User\globalStorage\state.vscdb" "C:\Users\HP\AppData\Roaming\Antigravity IDE\User\globalStorage\state.vscdb.bak" >nul 2>&1
copy "C:\Users\HP\AppData\Roaming\Antigravity IDE\User\workspaceStorage\f957e057da4e63963bc259b6311f1819\state.vscdb" "C:\Users\HP\AppData\Roaming\Antigravity IDE\User\workspaceStorage\f957e057da4e63963bc259b6311f1819\state.vscdb.bak" >nul 2>&1

echo.
echo Copying old history database files to the new IDE location...
copy "C:\Users\HP\AppData\Roaming\Antigravity\User\globalStorage\state.vscdb" "C:\Users\HP\AppData\Roaming\Antigravity IDE\User\globalStorage\state.vscdb" /Y
copy "C:\Users\HP\AppData\Roaming\Antigravity\User\workspaceStorage\f957e057da4e63963bc259b6311f1819\state.vscdb" "C:\Users\HP\AppData\Roaming\Antigravity IDE\User\workspaceStorage\f957e057da4e63963bc259b6311f1819\state.vscdb" /Y

echo.
echo Copying old .gemini/antigravity index files...
copy "C:\Users\HP\.gemini\antigravity\agyhub_summaries_proto.pb" "C:\Users\HP\.gemini\antigravity-ide\agyhub_summaries_proto.pb" /Y >nul 2>&1
copy "C:\Users\HP\.gemini\antigravity\antigravity_state.pbtxt" "C:\Users\HP\.gemini\antigravity-ide\antigravity_state.pbtxt" /Y >nul 2>&1

echo.
echo ======================================================
echo SUCCESS: History restored!
echo You can now reopen your Antigravity IDE and see your chats.
echo ======================================================
echo.
pause
