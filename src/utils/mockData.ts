import { Incident } from '../types/incidents';

// Función para generar datos simulados de una incidencia
export function getMockIncident(incidentId: string = 'INC-00001'): Incident {
  // La fecha actual
  const now = new Date();
  
  // Fecha de creación (2 días atrás)
  const createdDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  
  // Fecha límite (2 días en el futuro)
  const deadlineDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  
  // Datos del repartidor (actor)
  const carrierNames = ['Juan Carlos Gómez', 'María López', 'Carlos Hernández', 'Ana Martínez'];
  const carrierName = carrierNames[Math.floor(Math.random() * carrierNames.length)];
  
  return {
    _id: `mock${incidentId.replace('INC-', '')}`,
    incidentId: incidentId,
    guideNumber: `T1-${Math.floor(Math.random() * 10000000)}`,
    trackingNumber: `T1-${Math.floor(Math.random() * 10000000)}`,
    commerceId: 152,
    carrierId: 1, // DHL
    status: 'requires_action',
    type: 'address_change',
    priority: 'medium',
    createdAt: createdDate.toISOString(),
    updatedAt: createdDate.toISOString(),
    deadline: deadlineDate.toISOString(),
    slaHours: 48,
    formattedDeadline: deadlineDate.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }),
    shipmentDetails: {
      origin: {
        street: 'Calzada del Hueso Número 160 Interior 4C',
        neighborhood: 'Ex Hacienda Coapa',
        number: '160',
        postalCode: '01500',
        municipality: 'Coyoacán',
        state: 'Ciudad de México',
        contact: 'Empresa de Origen',
        phone: '5555555555',
        email: 'contacto@empresa.com',
        company: 'Empresa Ejemplo S.A. de C.V.'
      },
      destination: {
        street: 'Calle Cerro de la Silla 2599',
        neighborhood: 'Campanario',
        number: '2599',
        postalCode: '09310',
        municipality: 'Iztapalapa',
        state: 'Ciudad de México',
        contact: 'Cliente Ejemplo',
        phone: '5512345678',
        email: 'cliente@ejemplo.com',
        company: null
      },
      package: {
        weight: '1.5',
        dimensions: {
          length: '20',
          width: '15',
          height: '10'
        },
        description: 'Paquete de prueba',
        value: '1500.00',
        service: 'Express',
        service_type: 'EXPRESS DOMESTIC'
      },
      cost: '350.00'
    },
    // Historial de cambios
    timeline: [
      {
        status: 'created',
        timestamp: createdDate.toISOString(),
        actor: {
          id: 152,
          type: 'commerce',
          name: 'Comercio Ejemplo'
        },
        notes: 'Incidencia creada'
      },
      {
        status: 'requires_action',
        timestamp: new Date(createdDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        actor: {
          id: 0,
          type: 'system',
          name: 'Sistema'
        },
        notes: 'Incidencia asignada a paquetería'
      }
    ],
    // Detalles de la acción
    actionDetails: [
      {
        type: 'address_change',
        address_change: {
          calle: 'Avenida Insurgentes Sur',
          numero: '1234',
          colonia: 'Del Valle',
          código_postal: '03100',
          municipio: 'Benito Juárez',
          estado: 'Ciudad de México'
        }
      }
    ],
    metadata: {
      source: 'carrier_portal',
      resolutionTime: 48,
      priority: 'medium',
      notes: ['Incidencia generada automáticamente para pruebas']
    },
    // Campos adicionales para compatibilidad
    customerName: 'Cliente Ejemplo',
    customerEmail: 'cliente@ejemplo.com',
    address: {
      street: 'Avenida Insurgentes Sur',
      neighborhood: 'Del Valle',
      postalCode: '03100',
      state: 'Ciudad de México'
    },
    currentAddress: {
      street: 'Calle Cerro de la Silla 2599',
      neighborhood: 'Campanario',
      postalCode: '09310',
      state: 'Ciudad de México'
    }
  };
}

// Generar una lista de incidencias de prueba
export function getMockIncidents(count: number = 10): Incident[] {
  const types: any[] = [
    'address_change',
    'recipient_not_found',
    'restricted_access',
    'package_without_movement',
    'return_to_origin'
  ];
  
  const statuses: any[] = [
    'requires_action',
    'in_review',
    'in_process',
    'approved',
    'finalized'
  ];
  
  const result: Incident[] = [];
  
  for (let i = 0; i < count; i++) {
    const mockIncident = getMockIncident(`INC-${10000 + i}`);
    
    // Asignar tipo y estado aleatorios
    mockIncident.type = types[Math.floor(Math.random() * types.length)];
    mockIncident.status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Variar las horas restantes del SLA
    const slaHours = Math.floor(Math.random() * 50);
    mockIncident.slaHours = slaHours;
    mockIncident.deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();
    
    // Asignar información del shipment y otra data requerida
    mockIncident.shipmentDetails = {
      origin: {
        street: `Calle Origen ${i + 1}`,
        neighborhood: `Colonia Origen ${i + 1}`,
        number: `${i + 100}`,
        postalCode: `${10000 + i}`,
        municipality: `Municipio ${i + 1}`,
        state: 'Ciudad de México',
        contact: `Contacto Origen ${i + 1}`,
        phone: `55${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `contacto${i}@empresa.com`,
        company: `Empresa ${i + 1}`
      },
      destination: {
        street: `Calle Destino ${i + 1}`,
        neighborhood: `Colonia Destino ${i + 1}`,
        number: `${i + 200}`,
        postalCode: `${20000 + i}`,
        municipality: `Municipio Destino ${i + 1}`,
        state: 'Estado de México',
        contact: `Cliente ${i + 1}`,
        phone: `55${Math.floor(10000000 + Math.random() * 90000000)}`,
        email: `cliente${i}@example.com`,
        company: null
      },
      package: {
        weight: `${(Math.random() * 10).toFixed(1)}`,
        dimensions: {
          length: `${Math.floor(Math.random() * 50 + 10)}`,
          width: `${Math.floor(Math.random() * 40 + 10)}`,
          height: `${Math.floor(Math.random() * 30 + 5)}`
        },
        description: `Producto ${i + 1}`,
        value: `${Math.floor(Math.random() * 5000 + 500)}.00`,
        service: Math.random() > 0.5 ? 'Express' : 'Estándar',
        service_type: Math.random() > 0.5 ? 'EXPRESS DOMESTIC' : 'STANDARD'
      },
      cost: `${Math.floor(Math.random() * 500 + 100)}.00`
    };
    
    // Añadir detalles de acción según el tipo
    if (mockIncident.type === 'address_change') {
      mockIncident.actionDetails = [
        {
          type: 'address_change',
          address_change: {
            calle: `Nueva Calle ${i + 1}`,
            numero: `${i + 300}`,
            colonia: `Nueva Colonia ${i + 1}`,
            código_postal: `${Math.floor(Math.random() * 89999) + 10000}`,
            municipio: `Nuevo Municipio ${i + 1}`,
            estado: 'Ciudad de México'
          }
        }
      ];
    }
    
    // Añadir un timeline más completo
    mockIncident.timeline = [
      {
        status: 'created',
        timestamp: new Date(Date.now() - (3 + i) * 24 * 60 * 60 * 1000).toISOString(),
        actor: {
          id: 152,
          type: 'commerce',
          name: 'Comercio Ejemplo'
        },
        notes: 'Incidencia creada'
      }
    ];
    
    // Añadir más entradas al timeline según el estado
    if (['in_review', 'in_process', 'approved', 'finalized'].includes(mockIncident.status)) {
      mockIncident.timeline.push({
        status: 'in_review',
        timestamp: new Date(Date.now() - (2 + i) * 24 * 60 * 60 * 1000).toISOString(),
        actor: {
          id: 1,
          type: 'carrier',
          name: 'Operador de Paquetería'
        },
        notes: 'Incidencia en revisión'
      });
    }
    
    if (['in_process', 'approved', 'finalized'].includes(mockIncident.status)) {
      mockIncident.timeline.push({
        status: 'in_process',
        timestamp: new Date(Date.now() - (1 + i) * 24 * 60 * 60 * 1000).toISOString(),
        actor: {
          id: 1,
          type: 'carrier',
          name: 'Operador de Paquetería'
        },
        notes: 'Incidencia en proceso'
      });
    }
    
    if (['approved', 'finalized'].includes(mockIncident.status)) {
      mockIncident.timeline.push({
        status: 'approved',
        timestamp: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
        actor: {
          id: 1,
          type: 'carrier',
          name: 'Operador de Paquetería'
        },
        notes: 'Incidencia aprobada'
      });
    }
    
    if (mockIncident.status === 'finalized') {
      mockIncident.timeline.push({
        status: 'finalized',
        timestamp: new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString(),
        actor: {
          id: 1,
          type: 'carrier',
          name: 'Operador de Paquetería'
        },
        notes: 'Incidencia finalizada'
      });
    }
    
    result.push(mockIncident);
  }
  
  return result;
}