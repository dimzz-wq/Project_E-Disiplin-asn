# Script untuk menjalankan dan menginisialisasi MariaDB portable
param(
    [string]$MariaDbPath = "C:\mysql\mariadb-11.4.3-winx64"
)

$binPath = Join-Path $MariaDbPath "bin"
$dataDir = Join-Path $MariaDbPath "data"

if (-not (Test-Path $binPath)) {
    # Cek jika ada subfolder tunggal di dalam C:\mysql
    $subDirs = Get-ChildItem -Path "C:\mysql" -Directory
    if ($subDirs.Count -eq 1) {
        $MariaDbPath = $subDirs[0].FullName
        $binPath = Join-Path $MariaDbPath "bin"
        $dataDir = Join-Path $MariaDbPath "data"
    }
}

Write-Host "Menggunakan MariaDB di: $MariaDbPath"

# Inisialisasi data directory jika belum ada
if (-not (Test-Path (Join-Path $dataDir "mysql"))) {
    Write-Host "Menginisialisasi data directory..."
    $installDb = Join-Path $binPath "mariadb-install-db.exe"
    if (-not (Test-Path $installDb)) {
        $installDb = Join-Path $binPath "mysql_install_db.exe"
    }
    
    if (Test-Path $installDb) {
        & $installDb --datadir="$dataDir"
        Write-Host "Inisialisasi selesai."
    } else {
        Write-Warning "Tool install-db tidak ditemukan, mencoba menjalankan mysqld langsung..."
    }
}

# Jalankan mysqld di background
$mysqld = Join-Path $binPath "mysqld.exe"
Write-Host "Menjalankan mysqld..."
Start-Process -FilePath $mysqld -ArgumentList "--console", "--datadir=`"$dataDir`"" -WindowStyle Hidden

Start-Sleep -Seconds 3

# Test koneksi
$mysqlCli = Join-Path $binPath "mariadb.exe"
if (-not (Test-Path $mysqlCli)) { $mysqlCli = Join-Path $binPath "mysql.exe" }

if (Test-Path $mysqlCli) {
    & $mysqlCli -u root -e "CREATE DATABASE IF NOT EXISTS edisiplin_asn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    Write-Host "Database edisiplin_asn siap!"
}
