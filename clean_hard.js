const fs = require('fs');
const glob = [
    'frontend/src/api/authApi.ts', 'frontend/src/api/http.ts', 'frontend/src/api/index.ts',
    'frontend/src/api/ventasApi.ts', 'frontend/src/pages/DashboardPrincipalPage.tsx',
    'frontend/src/pages/EmpleadoDashboardPage.tsx', 'frontend/src/pages/GestionOrganizacionalPage.tsx',
    'frontend/src/pages/LoginPage.tsx', 'frontend/src/pages/ReportesPage.tsx',
    'frontend/src/types/domain.ts', 'frontend/src/utils/stockUtils.ts', 'backend/ms-auth/pom.xml'
];
glob.forEach(f => {
    try {
        let content = fs.readFileSync(f, 'utf8');
        const lines = content.split('\n');
        let out = [];
        let inConflict = false;
        let keeping = false;
        for(let i=0; i<lines.length; i++){
            if(lines[i].startsWith('<<<<<<< HEAD')){
                inConflict = true;
                keeping = true;
                continue;
            }
            if(lines[i].startsWith('=======')){
                keeping = false;
                continue;
            }
            if(lines[i].startsWith('>>>>>>>')){
                inConflict = false;
                keeping = true;
                continue;
            }
            if(!inConflict || keeping){
                out.push(lines[i]);
            }
        }
        fs.writeFileSync(f, out.join('\n'));
        console.log('Limpiado: ' + f);
    } catch(e) {}
});
