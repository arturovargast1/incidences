# Modales para Alertas y Errores

Este documento describe la implementación de modales para reemplazar alertas tradicionales y mensajes de error en la aplicación.

## Descripción

Los modales de alerta y error son una mejora de la experiencia de usuario que reemplazan las alertas tradicionales por modales más elegantes y menos intrusivos. Estos modales se muestran en diferentes situaciones, como problemas con el token de autenticación, errores de exportación, o errores generales en la aplicación.

## Componentes

La implementación consta de los siguientes componentes:

1. **TokenModal.tsx**: Modal específico para alertas de token.
2. **TokenAlert.tsx**: Componente que detecta problemas con el token y muestra el modal.
3. **ExportErrorModal.tsx**: Modal específico para errores de exportación a Excel.
4. **ErrorModal.tsx**: Modal genérico para cualquier tipo de error en la aplicación.
5. **tokenUtils.ts**: Utilidades para manejar problemas con el token.

## Integración

- El componente **TokenAlert** está integrado en el AppLayout, lo que significa que está disponible en todas las páginas de la aplicación que utilizan este layout.
- El componente **ExportErrorModal** está integrado en la página de incidencias para mostrar errores de exportación a Excel.
- El componente **ErrorModal** es genérico y puede ser utilizado en cualquier parte de la aplicación para mostrar mensajes de error.

## Funcionamiento

### TokenAlert y TokenModal

1. El componente TokenAlert verifica periódicamente si la variable global `window.tokenHasIssues` está establecida en `true`.
2. Cuando se detecta un problema con el token (por ejemplo, un error 401 o 403 en una solicitud API), la función `checkTokenIssue` en `tokenUtils.ts` establece esta variable en `true`.
3. El componente TokenAlert detecta el cambio y muestra el modal.
4. El usuario puede elegir continuar trabajando o cerrar sesión.

### ExportErrorModal

1. Cuando ocurre un error al exportar a Excel, se muestra este modal con el mensaje de error específico.
2. El modal proporciona sugerencias para resolver el problema.

### ErrorModal

1. Componente genérico que puede ser utilizado para mostrar cualquier tipo de error en la aplicación.
2. Acepta un título personalizado, un mensaje de error y sugerencias específicas.
3. Si no se proporcionan sugerencias, muestra sugerencias predeterminadas.

## Uso en el código

### TokenAlert y TokenModal

```typescript
import { checkTokenIssue } from '../lib/tokenUtils';

// En una función que maneja respuestas API
function handleApiResponse(response) {
  if (response.status === 401 || response.status === 403) {
    checkTokenIssue({
      status: response.status,
      message: 'Token no autorizado'
    });
    // No redirigir inmediatamente al login para evitar pérdida de datos
  }
  
  // Continuar procesando la respuesta...
}
```

### ExportErrorModal

```typescript
// En un componente que maneja exportación a Excel
const [exportError, setExportError] = useState<string | null>(null);
const [isExportErrorModalOpen, setIsExportErrorModalOpen] = useState<boolean>(false);

const handleExportToExcel = async () => {
  try {
    // Lógica de exportación...
  } catch (error) {
    setExportError(error instanceof Error ? error.message : 'Error desconocido');
    setIsExportErrorModalOpen(true);
  }
};

// En el JSX
<ExportErrorModal
  isOpen={isExportErrorModalOpen}
  onClose={() => setIsExportErrorModalOpen(false)}
  errorMessage={exportError || ''}
/>
```

### ErrorModal genérico

```typescript
// En un componente que maneja errores
const [error, setError] = useState<string | null>(null);
const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);

const handleSomeAction = async () => {
  try {
    // Lógica que puede generar errores...
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error desconocido');
    setIsErrorModalOpen(true);
  }
};

// En el JSX
<ErrorModal
  isOpen={isErrorModalOpen}
  onClose={() => setIsErrorModalOpen(false)}
  title="Error en la operación"
  errorMessage={error || ''}
  suggestions={[
    'Verifique los datos ingresados',
    'Intente nuevamente más tarde'
  ]}
/>
```

## Páginas de prueba

Se han creado dos páginas para probar el funcionamiento del modal:

1. **public/test-token-modal.html**: Una página HTML simple para probar el modal fuera del contexto de la aplicación.
2. **src/app/test-token/page.tsx**: Una página integrada en la aplicación Next.js que utiliza el AppLayout y permite probar el modal en el contexto real.

## Ventajas sobre las alertas tradicionales

- **Mejor experiencia de usuario**: No interrumpe el flujo de trabajo del usuario.
- **Diseño consistente**: Se integra con el diseño general de la aplicación.
- **Mayor visibilidad**: El mensaje es más claro y visible.
- **Opciones claras**: El usuario tiene opciones claras sobre cómo proceder.
- **No bloquea la interfaz**: El usuario puede seguir interactuando con la aplicación.

## Implementación técnica

El modal utiliza las mismas técnicas y estilos que otros modales en la aplicación, como el CsvUploadModal, para mantener la consistencia visual y de comportamiento.
