# Plan de Desharcodeo y Refactorización Frontend - Grupo Cordillera

Este plan detalla los pasos para profesionalizar el código del frontend, eliminando valores "escritos a fuego" (hardcoded) y mejorando la arquitectura antes del despliegue en AWS.

## 1. Objetivos
- **Mantenibilidad:** Cambiar un color o una URL en un solo lugar.
- **Limpieza de Código:** Reducir el tamaño de los archivos de páginas (Pages) extrayendo estilos y lógica.
- **Preparación para Producción:** Configurar el sistema para manejar diferentes IPs en AWS sin tocar el código fuente.

## 2. Fase de Centralización (Constantes y Tipos)
- [ ] **Crear `src/constants/theme.ts`**: Definir los colores de la marca (Verde esmeralda, azul corporativo, etc.).
- [ ] **Crear `src/constants/apiEndpoints.ts`**: Mover todas las rutas de microservicios aquí.
- [ ] **Configurar `.env`**: Crear archivo de variables de entorno para la URL base (Esencial para AWS).

## 3. Fase de Componentes Atómicos (`src/components/common`)
Extraer elementos visuales repetitivos para eliminar los estilos inline (`style={{...}}`):
- [ ] **`Button.tsx`**: Componente único para todos los botones del sistema (Primary, Success, Danger).
- [ ] **`Card.tsx`**: Para los contenedores con sombra y bordes redondeados.
- [ ] **`Input.tsx` / `Select.tsx`**: Normalizar el aspecto de los formularios.

## 4. Fase de Refactorización de Páginas
Aplicar los nuevos componentes en las páginas críticas sin alterar la lógica actual:
- [ ] **`EmpleadoDashboardPage.tsx`**: Reemplazar botones manuales y estilos de formularios por componentes.
- [ ] **`ReportesPage.tsx`**: Limpiar la tabla de auditoría y los botones de eliminar.
- [ ] **`LoginPage.tsx`**: Centralizar el manejo de colores del login.

## 5. Fase de Lógica Reutilizable (Hooks)
- [ ] **`useAuth.ts`**: (Si aplica) para centralizar el chequeo de roles y permisos.
- [ ] **`useNotify.ts`**: Para estandarizar cómo se muestran los mensajes de éxito/error.

## 6. Validación Final
- [ ] Ejecutar `npm run build` para asegurar que no hay errores de tipado.
- [ ] Verificar que la aplicación se conecta correctamente usando las variables de entorno.

---
**Nota Importante:** Este proceso NO cambiará la funcionalidad actual. Las ventas se seguirán registrando igual y los reportes se verán igual, pero el "motor" por dentro estará ordenado.
