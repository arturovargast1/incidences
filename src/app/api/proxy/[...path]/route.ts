import { NextRequest, NextResponse } from 'next/server';

// La URL base de la API a la que queremos hacer proxy
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apiv2.dev.t1envios.com';

// Variable opcional para depuración
const DEBUGGING = true;

// Use a simpler approach for Next.js 15.2.2 compatibility
export async function GET(request: NextRequest, context: any) {
  // Asegurar que params.path exista antes de usarlo
  const path = context.params?.path || [];
  return handleRequest(request, path, 'GET');
}

export async function POST(request: NextRequest, context: any) {
  // Asegurar que params.path exista antes de usarlo
  const path = context.params?.path || [];
  return handleRequest(request, path, 'POST');
}

export async function PUT(request: NextRequest, context: any) {
  // Asegurar que params.path exista antes de usarlo
  const path = context.params?.path || [];
  return handleRequest(request, path, 'PUT');
}

export async function DELETE(request: NextRequest, context: any) {
  // Asegurar que params.path exista antes de usarlo
  const path = context.params?.path || [];
  return handleRequest(request, path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Reconstruir la ruta desde los segmentos de la ruta
    const path = pathSegments.join('/');
    
    // Obtener los parámetros de consulta (query parameters)
    const url = new URL(request.url);
    const queryString = url.search;
    
    // Construir la URL completa con parámetros de consulta
    const fullUrl = `${API_BASE_URL}/${path}${queryString}`;
    
    if (DEBUGGING) {
      console.log(`Proxy request to: ${fullUrl}`);
    }
    
    // Obtener el cuerpo de la solicitud si es necesario
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
      console.log(`Request body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
    }
    
    // Obtener todos los encabezados excepto host y connection
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
        headers.append(key, value);
        if (DEBUGGING) {
          console.log(`Header: ${key} = ${key.toLowerCase() === 'authorization' ? 'Bearer xxxxx...' : value}`);
        }
      }
    });
    
    // Verificar si hay headers de autorización y registrar su presencia
    if (headers.has('Authorization')) {
      const authHeader = headers.get('Authorization');
      console.log(`Authorization header present: ${authHeader?.substring(0, 15)}...`);
    } else {
      console.warn('No Authorization header found in request!');
    }
    
    console.log(`Sending ${method} request to: ${fullUrl}`);
    if (body) {
      console.log(`With body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
    }
    
    // Realizar la solicitud al backend con timeout más largo
    const apiResponse = await fetch(fullUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
      // Aumentar el timeout para evitar errores de conexión
      signal: AbortSignal.timeout(15000) // 15 segundos
    });
    
    // Obtener el cuerpo de la respuesta
    const responseData = await apiResponse.text();
    
    console.log(`Response status: ${apiResponse.status} ${apiResponse.statusText}`);
    console.log(`Response data: ${responseData.substring(0, 100)}${responseData.length > 100 ? '...' : ''}`);
    
    // Manejar específicamente el error 410 Gone
    if (apiResponse.status === 410) {
      console.error('Error 410 Gone - El recurso ya no está disponible');
      return new NextResponse(JSON.stringify({
        error: 'El recurso ya no está disponible',
        message: 'El endpoint solicitado ya no está disponible. Por favor, contacte al administrador del sistema.',
        code: 410
      }), {
        status: 410,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Manejar errores de autenticación
    if (apiResponse.status === 401 || apiResponse.status === 403) {
      console.error(`Error de autenticación: ${apiResponse.status} ${apiResponse.statusText}`);
      let errorMessage = 'Error de autenticación';
      
      try {
        const errorData = JSON.parse(responseData);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Si no se puede parsear como JSON, usar el texto de respuesta
        errorMessage = responseData || 'Información de autenticación no disponible';
      }
      
      return new NextResponse(JSON.stringify({
        error: errorMessage,
        message: 'Por favor, inicie sesión nuevamente.',
        code: apiResponse.status
      }), {
        status: apiResponse.status,
        headers: { 'content-type': 'application/json' },
      });
    }
    
    // Crear una nueva respuesta
    const response = new NextResponse(responseData, {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
    });
    
    // Copiar los encabezados relevantes
    apiResponse.headers.forEach((value, key) => {
      if (
        key.toLowerCase() !== 'content-length' &&
        key.toLowerCase() !== 'connection' &&
        key.toLowerCase() !== 'content-encoding'
      ) {
        response.headers.set(key, value);
        console.log(`Setting header: ${key} = ${value}`);
      }
    });
    
    // Establecer el tipo de contenido si no está establecido
    if (!response.headers.has('content-type')) {
      response.headers.set('content-type', 'application/json');
      console.log('Added default content-type: application/json');
    }
    
    return response;
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Proporcionar más información sobre el error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return new NextResponse(JSON.stringify({ 
      error: 'Error en el proxy', 
      message: errorMessage,
      path: pathSegments.join('/'),
      method
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
