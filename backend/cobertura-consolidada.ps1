# Genera un reporte de cobertura CONSOLIDADO de todos los microservicios.
# Corre los tests de cada servicio (JaCoCo) y junta los resultados en una sola
# pagina HTML: backend\cobertura\index.html
#
# Uso:
#   .\cobertura-consolidada.ps1            # corre tests + genera el reporte y lo abre
#   .\cobertura-consolidada.ps1 -SinTests  # solo regenera el HTML con los datos ya existentes

param([switch]$SinTests)

$ErrorActionPreference = "Stop"
$base = $PSScriptRoot
$servicios = "ms-auth", "ms-datos", "ms-kpis", "ms-reportes"

if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
}

# 1) Correr los tests de cada servicio (salvo que se pida -SinTests)
if (-not $SinTests) {
    foreach ($s in $servicios) {
        Write-Host "Corriendo tests de $s ..." -ForegroundColor Cyan
        Push-Location "$base\$s"
        & .\mvnw.cmd -q test | Out-Null
        Pop-Location
    }
}

# 2) Leer el jacoco.csv de cada servicio y calcular cobertura
$filas = @()
$totInstrCov = 0; $totInstrMiss = 0; $totBranchCov = 0; $totBranchMiss = 0

foreach ($s in $servicios) {
    $csv = "$base\$s\target\site\jacoco\jacoco.csv"
    if (-not (Test-Path $csv)) {
        Write-Warning "No hay reporte para $s (corre los tests primero)."
        continue
    }
    $rows = Import-Csv $csv
    $iCov = ($rows | Measure-Object INSTRUCTION_COVERED -Sum).Sum
    $iMiss = ($rows | Measure-Object INSTRUCTION_MISSED -Sum).Sum
    $bCov = ($rows | Measure-Object BRANCH_COVERED -Sum).Sum
    $bMiss = ($rows | Measure-Object BRANCH_MISSED -Sum).Sum

    $totInstrCov += $iCov; $totInstrMiss += $iMiss
    $totBranchCov += $bCov; $totBranchMiss += $bMiss

    $pInstr = if (($iCov + $iMiss) -gt 0) { [math]::Round($iCov / ($iCov + $iMiss) * 100, 1) } else { 0 }
    $pBranch = if (($bCov + $bMiss) -gt 0) { [math]::Round($bCov / ($bCov + $bMiss) * 100, 1) } else { 100 }

    $filas += [pscustomobject]@{
        Servicio = $s
        Instr    = $pInstr
        Branch   = $pBranch
        Link     = "../$s/target/site/jacoco/index.html"
    }
}

$totPInstr = if (($totInstrCov + $totInstrMiss) -gt 0) { [math]::Round($totInstrCov / ($totInstrCov + $totInstrMiss) * 100, 1) } else { 0 }
$totPBranch = if (($totBranchCov + $totBranchMiss) -gt 0) { [math]::Round($totBranchCov / ($totBranchCov + $totBranchMiss) * 100, 1) } else { 100 }

# 3) Construir el HTML
function Color($p) { if ($p -ge 80) { "#1a7f37" } elseif ($p -ge 50) { "#bf8700" } else { "#cf222e" } }

$filasHtml = ""
foreach ($f in $filas) {
    $c = Color $f.Instr
    $filasHtml += @"
      <tr>
        <td><a href="$($f.Link)">$($f.Servicio)</a></td>
        <td style="color:$c;font-weight:600">$($f.Instr)%</td>
        <td>$($f.Branch)%</td>
        <td><a href="$($f.Link)">ver detalle &rarr;</a></td>
      </tr>
"@
}

$cTot = Color $totPInstr
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm"

$html = @"
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Cobertura consolidada - Grupo Cordillera</title>
<style>
  body { font-family: system-ui, Segoe UI, Arial, sans-serif; background:#0d1117; color:#e6edf3; margin:0; padding:40px; }
  .card { max-width:760px; margin:0 auto; background:#161b22; border:1px solid #30363d; border-radius:12px; padding:32px; }
  h1 { margin:0 0 4px; font-size:22px; }
  .sub { color:#8b949e; font-size:13px; margin-bottom:24px; }
  .total { font-size:48px; font-weight:700; color:$cTot; line-height:1; }
  .total small { font-size:14px; color:#8b949e; font-weight:400; display:block; margin-top:6px;}
  table { width:100%; border-collapse:collapse; margin-top:28px; }
  th, td { text-align:left; padding:12px 10px; border-bottom:1px solid #30363d; font-size:14px; }
  th { color:#8b949e; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.5px; }
  a { color:#58a6ff; text-decoration:none; }
  a:hover { text-decoration:underline; }
</style>
</head>
<body>
  <div class="card">
    <h1>Cobertura de pruebas - Backend</h1>
    <div class="sub">Grupo Cordillera &middot; generado el $fecha</div>
    <div class="total">$totPInstr%<small>cobertura total de instrucciones ($($filas.Count) microservicios)</small></div>
    <table>
      <thead>
        <tr><th>Microservicio</th><th>Instrucciones</th><th>Ramas</th><th>Reporte</th></tr>
      </thead>
      <tbody>
$filasHtml
      </tbody>
    </table>
  </div>
</body>
</html>
"@

$salida = "$base\cobertura"
New-Item -ItemType Directory -Force -Path $salida | Out-Null
$indexPath = "$salida\index.html"
$html | Out-File -FilePath $indexPath -Encoding utf8

Write-Host ""
Write-Host "Reporte consolidado generado en: $indexPath" -ForegroundColor Green
Write-Host ("Cobertura total: {0}%" -f $totPInstr) -ForegroundColor Green
Start-Process $indexPath
