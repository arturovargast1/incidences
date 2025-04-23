export interface IncidentAddress {
  street: string;
  neighborhood: string;
  postalCode: string;
  city?: string;
  state?: string;
}

export type IncidentType = 
  | 'address_change'
  | 'recipient_not_found'
  | 'restricted_access'
  | 'package_without_movement'
  | 'package_rejected'
  | 'failed_pickups'
  | 'delivery_delay'
  | 'package_pending_pickup'
  | 'package_damaged'
  | 'package_lost'
  | 'package_opened_or_tampered'
  | 'theft'
  | 'theft_with_violence'
  | 'return_to_origin'
  | 'compensation_payment'
  | 'package_not_received'
  // Nuevos tipos de incidencia
  | 'wrong_address_delivery'
  | 'send_to_courier'
  | 'overweight'
  | 'cancel_guide';

export type IncidentStatus = 
  | 'requires_action'
  | 'in_review'
  | 'in_process'
  | 'approved'
  | 'finalized'
  | 'pending'
  | 'additional_information'  // Información adicional
  | 'review'  // Revisión
  | 'reopen';  // Reapertura

export interface ShipmentDetails {
  origin: {
    street?: string;
    neighborhood?: string;
    number?: string;
    postalCode?: string;
    municipality?: string;
    state?: string;
    contact?: string;
    phone?: string;
    email?: string;
    company?: string | null;
  };
  destination: {
    street?: string;
    neighborhood?: string;
    number?: string;
    postalCode?: string;
    municipality?: string;
    state?: string;
    contact?: string;
    phone?: string;
    email?: string;
    company?: string | null;
  };
  package?: {
    weight?: string;
    dimensions?: {
      length?: string;
      width?: string;
      height?: string;
    };
    description?: string;
    value?: string;
    service?: string;
    service_type?: string;
  };
  cost?: string;
}

export interface Incident {
  _id?: string;
  incidentId: string;
  guideNumber?: string;
  trackingNumber?: string; // Para mantener compatibilidad con el código existente
  commerceId?: number;
  carrierId: number;
  carrier?: {
    id: number;
    name: string;
  };
  assigned_user?: {
    email: string;
  };
  status_mensajeria: IncidentStatus;
  status?: IncidentStatus; // Mantener por compatibilidad retroactiva
  operations_status?: IncidentStatus; // Estado de operaciones (visible solo para usuarios T1)
  type: IncidentType;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt?: string;
  deadline: string;
  shipmentDetails: ShipmentDetails;
  timeline?: {
    status: string;
    timestamp: string;
    actor: {
      id: string | number;
      type: string;
      name: string;
    };
    notes: string;
  }[];
  actionDetails?: any[];
  metadata?: {
    source?: string;
    resolutionTime?: number;
    priority?: 'low' | 'medium' | 'high';
    notes?: string[];
  };
  resolution?: {
    status: string;
    timestamp: string;
    resolvedBy: string;
    notes: string;
    customerNotified?: boolean;
  };
  
  // Campos adicionales para compatibilidad con el código existente
  customerName?: string;
  customerEmail?: string;
  address?: IncidentAddress;
  currentAddress?: IncidentAddress;
  slaHours?: number;
  formattedDeadline?: string;
}

export interface IncidentUpdateRequest {
  incidentId: string;
  status?: string;
  status_mensajeria?: string;
  notes?: string;
  resolution?: {
    approved: boolean;
    reason: string;
  };
}
