---
description: Cómo desplegar correctamente las Edge Functions de Asensio ADMS
---

# Workflow: Desplegar Funciones de Asensio ADMS

Sigue estos pasos para que el despliegue no falle debido a la seguridad JWT:

1.  **Asegurar que Docker esté corriendo** (si es para local) o usar la CLI vinculada a la nube.
2.  **Configurar Secretos** (Solo si cambiaste de proyecto):
    ```powershell
    supabase secrets set PROJECT_URL="https://tu-id.supabase.co"
    supabase secrets set SERVICE_ROLE_KEY="tu-key"
    ```
3.  **Desplegar la función ADMS** (Sin validación JWT externa):
    // turbo
    `supabase functions deploy adms --no-verify-jwt`
4.  **Desplegar la función de Administración** (Sin validación JWT externa):
    // turbo
    `supabase functions deploy admin-api --no-verify-jwt`
5.  **Verificar Logs**:
    Entra al Dashboard de Supabase -> Edge Functions -> Logs para confirmar que no hay errores 401.
