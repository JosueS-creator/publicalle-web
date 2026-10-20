// Generado desde Supabase (proyecto publicalle). Regenerar si cambia el esquema.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      agenda_franjas: {
        Row: { id: string; nombre: string; hora_inicio: string; hora_fin: string; dias_semana: number[]; cupos: number; activa: boolean; orden: number; creado_en: string };
        Insert: { nombre: string; hora_inicio: string; hora_fin: string; dias_semana?: number[]; cupos?: number; activa?: boolean; orden?: number };
        Update: { nombre?: string; hora_inicio?: string; hora_fin?: string; dias_semana?: number[]; cupos?: number; activa?: boolean; orden?: number };
        Relationships: [];
      };
      agenda_bloqueos: {
        Row: { id: string; fecha: string; franja_id: string | null; motivo: string | null; creado_en: string };
        Insert: { fecha: string; franja_id?: string | null; motivo?: string | null };
        Update: { fecha?: string; franja_id?: string | null; motivo?: string | null };
        Relationships: [
          { foreignKeyName: "agenda_bloqueos_franja_id_fkey"; columns: ["franja_id"]; isOneToOne: false; referencedRelation: "agenda_franjas"; referencedColumns: ["id"] },
        ];
      };
      campania_servicios: {
        Row: { campania_id: string; cantidad: number; detalle: Json; id: string; linea: Database["public"]["Enums"]["linea_servicio"]; servicio: string; unidad_medida: string };
        Insert: { campania_id: string; cantidad?: number; detalle?: Json; id?: string; linea: Database["public"]["Enums"]["linea_servicio"]; servicio: string; unidad_medida?: string };
        Update: { campania_id?: string; cantidad?: number; detalle?: Json; id?: string; linea?: Database["public"]["Enums"]["linea_servicio"]; servicio?: string; unidad_medida?: string };
        Relationships: [
          { foreignKeyName: "campania_servicios_campania_id_fkey"; columns: ["campania_id"]; isOneToOne: false; referencedRelation: "campanias"; referencedColumns: ["id"] },
        ];
      };
      campanias: {
        Row: {
          actualizado_en: string; ciudades: string[]; creado_en: string; creado_por: string | null; empresa_id: string;
          estado: Database["public"]["Enums"]["estado_campania"]; fecha_fin: string | null; fecha_inicio: string | null; id: string;
          nombre: string; objetivo: string | null; solicitud_id: string | null; zonas: string[];
        };
        Insert: {
          actualizado_en?: string; ciudades?: string[]; creado_en?: string; creado_por?: string | null; empresa_id: string;
          estado?: Database["public"]["Enums"]["estado_campania"]; fecha_fin?: string | null; fecha_inicio?: string | null; id?: string;
          nombre: string; objetivo?: string | null; solicitud_id?: string | null; zonas?: string[];
        };
        Update: {
          actualizado_en?: string; ciudades?: string[]; creado_en?: string; creado_por?: string | null; empresa_id?: string;
          estado?: Database["public"]["Enums"]["estado_campania"]; fecha_fin?: string | null; fecha_inicio?: string | null; id?: string;
          nombre?: string; objetivo?: string | null; solicitud_id?: string | null; zonas?: string[];
        };
        Relationships: [
          { foreignKeyName: "campanias_creado_por_fkey"; columns: ["creado_por"]; isOneToOne: false; referencedRelation: "perfiles"; referencedColumns: ["id"] },
          { foreignKeyName: "campanias_empresa_id_fkey"; columns: ["empresa_id"]; isOneToOne: false; referencedRelation: "empresas"; referencedColumns: ["id"] },
          { foreignKeyName: "campanias_solicitud_id_fkey"; columns: ["solicitud_id"]; isOneToOne: false; referencedRelation: "solicitudes"; referencedColumns: ["id"] },
        ];
      };
      config_comercial: {
        Row: {
          id: boolean; razon_social: string | null; rtn: string | null; telefono: string | null; correo: string | null; direccion: string | null;
          sitio_web: string | null; logo_ref: string | null; condiciones_defecto: string | null; vigencia_dias_defecto: number | null;
          isv_porcentaje: number | null; moneda: string; actualizado_en: string;
        };
        Insert: {
          razon_social?: string | null; rtn?: string | null; telefono?: string | null; correo?: string | null; direccion?: string | null;
          sitio_web?: string | null; logo_ref?: string | null; condiciones_defecto?: string | null; vigencia_dias_defecto?: number | null;
          isv_porcentaje?: number | null; moneda?: string;
        };
        Update: {
          razon_social?: string | null; rtn?: string | null; telefono?: string | null; correo?: string | null; direccion?: string | null;
          sitio_web?: string | null; logo_ref?: string | null; condiciones_defecto?: string | null; vigencia_dias_defecto?: number | null;
          isv_porcentaje?: number | null; moneda?: string; actualizado_en?: string;
        };
        Relationships: [];
      };
      cotizaciones: {
        Row: {
          id: string; campania_id: string; numero: string | null; version: number; cotizacion_origen_id: string | null;
          estado: Database["public"]["Enums"]["estado_cotizacion"]; proyecto: string | null; cliente_contacto: string | null; moneda: string;
          fecha_emision: string | null; vigencia_dias: number | null; fecha_vencimiento: string | null; impuesto_porcentaje: number;
          condiciones: string | null; notas_internas: string | null; subtotal: number; descuento_total: number; impuesto_total: number; total: number;
          snapshot: Json | null; token_hash: string | null; enlace_revocado_en: string | null; emitida_en: string | null; emitida_por: string | null;
          creado_por: string | null; creado_en: string; actualizado_en: string;
        };
        Insert: {
          campania_id: string; proyecto?: string | null; cliente_contacto?: string | null; moneda?: string; vigencia_dias?: number | null;
          impuesto_porcentaje?: number; condiciones?: string | null; notas_internas?: string | null; creado_por?: string | null;
        };
        Update: {
          proyecto?: string | null; cliente_contacto?: string | null; vigencia_dias?: number | null; impuesto_porcentaje?: number;
          condiciones?: string | null; notas_internas?: string | null;
        };
        Relationships: [
          { foreignKeyName: "cotizaciones_campania_id_fkey"; columns: ["campania_id"]; isOneToOne: false; referencedRelation: "campanias"; referencedColumns: ["id"] },
        ];
      };
      cotizacion_conceptos: {
        Row: {
          id: string; cotizacion_id: string; campania_servicio_id: string | null; orden: number; concepto: string; descripcion: string | null;
          cantidad: number; unidad: string; precio_unitario: number; descuento_porcentaje: number; subtotal: number;
        };
        Insert: {
          id?: string; cotizacion_id: string; campania_servicio_id?: string | null; orden?: number; concepto: string; descripcion?: string | null;
          cantidad: number; unidad?: string; precio_unitario: number; descuento_porcentaje?: number;
        };
        Update: {
          orden?: number; concepto?: string; descripcion?: string | null; cantidad?: number; unidad?: string; precio_unitario?: number; descuento_porcentaje?: number;
        };
        Relationships: [
          { foreignKeyName: "cotizacion_conceptos_cotizacion_id_fkey"; columns: ["cotizacion_id"]; isOneToOne: false; referencedRelation: "cotizaciones"; referencedColumns: ["id"] },
        ];
      };
      cotizacion_eventos: {
        Row: { id: string; cotizacion_id: string; evento: string; detalle: Json; usuario: string | null; creado_en: string };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "cotizacion_eventos_cotizacion_id_fkey"; columns: ["cotizacion_id"]; isOneToOne: false; referencedRelation: "cotizaciones"; referencedColumns: ["id"] },
        ];
      };
      ejecuciones: {
        Row: {
          campania_id: string; creado_en: string; estado: Database["public"]["Enums"]["estado_ejecucion"]; fecha: string;
          hora_fin_prog: string | null; hora_inicio_prog: string | null; id: string; km_en_zonas: number | null;
          linea: Database["public"]["Enums"]["linea_servicio"]; motivo_rechazo: string | null; operador_id: string | null;
          punto_lat: number | null; punto_lng: number | null; punto_nombre: string | null; rango: unknown; servicio: string;
          unidad_id: string | null; validada_en: string | null; validada_por: string | null; zonas: string[]; zonas_cubiertas: string[];
        };
        Insert: {
          campania_id: string; creado_en?: string; estado?: Database["public"]["Enums"]["estado_ejecucion"]; fecha: string;
          hora_fin_prog?: string | null; hora_inicio_prog?: string | null; id?: string; km_en_zonas?: number | null;
          linea: Database["public"]["Enums"]["linea_servicio"]; motivo_rechazo?: string | null; operador_id?: string | null;
          punto_lat?: number | null; punto_lng?: number | null; punto_nombre?: string | null; servicio: string;
          unidad_id?: string | null; validada_en?: string | null; validada_por?: string | null; zonas?: string[]; zonas_cubiertas?: string[];
        };
        Update: {
          campania_id?: string; estado?: Database["public"]["Enums"]["estado_ejecucion"]; fecha?: string;
          hora_fin_prog?: string | null; hora_inicio_prog?: string | null; km_en_zonas?: number | null;
          linea?: Database["public"]["Enums"]["linea_servicio"]; motivo_rechazo?: string | null; operador_id?: string | null;
          punto_lat?: number | null; punto_lng?: number | null; punto_nombre?: string | null; servicio?: string;
          unidad_id?: string | null; validada_en?: string | null; validada_por?: string | null; zonas?: string[]; zonas_cubiertas?: string[];
        };
        Relationships: [
          { foreignKeyName: "ejecuciones_campania_id_fkey"; columns: ["campania_id"]; isOneToOne: false; referencedRelation: "campanias"; referencedColumns: ["id"] },
          { foreignKeyName: "ejecuciones_operador_id_fkey"; columns: ["operador_id"]; isOneToOne: false; referencedRelation: "perfiles"; referencedColumns: ["id"] },
          { foreignKeyName: "ejecuciones_unidad_id_fkey"; columns: ["unidad_id"]; isOneToOne: false; referencedRelation: "unidades"; referencedColumns: ["id"] },
          { foreignKeyName: "ejecuciones_validada_por_fkey"; columns: ["validada_por"]; isOneToOne: false; referencedRelation: "perfiles"; referencedColumns: ["id"] },
        ];
      };
      ejecucion_eventos: {
        Row: { capturado_en: string | null; ejecucion_id: string; id: number; lat: number | null; lng: number | null; precision_m: number | null; registrado_en: string; registrado_por: string; tipo: Database["public"]["Enums"]["tipo_evento"] };
        Insert: { capturado_en?: string | null; ejecucion_id: string; lat?: number | null; lng?: number | null; precision_m?: number | null; registrado_por?: string; tipo: Database["public"]["Enums"]["tipo_evento"] };
        Update: { [_ in never]: never };
        Relationships: [
          { foreignKeyName: "ejecucion_eventos_ejecucion_id_fkey"; columns: ["ejecucion_id"]; isOneToOne: false; referencedRelation: "ejecuciones"; referencedColumns: ["id"] },
        ];
      };
      gps_puntos: {
        Row: { capturado_en: string; ejecucion_id: string; id: number; lat: number; lng: number; precision_m: number | null; registrado_en: string };
        Insert: { capturado_en: string; ejecucion_id: string; lat: number; lng: number; precision_m?: number | null };
        Update: { [_ in never]: never };
        Relationships: [
          { foreignKeyName: "gps_puntos_ejecucion_id_fkey"; columns: ["ejecucion_id"]; isOneToOne: false; referencedRelation: "ejecuciones"; referencedColumns: ["id"] },
        ];
      };
      incidencias: {
        Row: { descripcion: string; ejecucion_id: string; id: string; lat: number | null; lng: number | null; registrado_en: string; registrado_por: string; tipo: string };
        Insert: { descripcion: string; ejecucion_id: string; lat?: number | null; lng?: number | null; registrado_por?: string; tipo: string };
        Update: { [_ in never]: never };
        Relationships: [
          { foreignKeyName: "incidencias_ejecucion_id_fkey"; columns: ["ejecucion_id"]; isOneToOne: false; referencedRelation: "ejecuciones"; referencedColumns: ["id"] },
        ];
      };
      empresas: {
        Row: { correo: string | null; creado_en: string; id: string; nombre: string; rtn: string | null; telefono: string | null };
        Insert: { correo?: string | null; creado_en?: string; id?: string; nombre: string; rtn?: string | null; telefono?: string | null };
        Update: { correo?: string | null; id?: string; nombre?: string; rtn?: string | null; telefono?: string | null };
        Relationships: [];
      };
      evidencias: {
        Row: {
          capturado_en: string | null; ejecucion_id: string; estado: Database["public"]["Enums"]["estado_evidencia"]; id: string;
          lat: number | null; lng: number | null; momento: string | null; registrado_en: string; revisada_en: string | null;
          revisada_por: string | null; sha256: string; storage_path: string; subida_por: string; tipo: Database["public"]["Enums"]["tipo_evidencia"];
        };
        Insert: {
          capturado_en?: string | null; ejecucion_id: string; estado?: Database["public"]["Enums"]["estado_evidencia"]; id?: string;
          lat?: number | null; lng?: number | null; momento?: string | null; sha256: string; storage_path: string; subida_por?: string;
          tipo?: Database["public"]["Enums"]["tipo_evidencia"];
        };
        Update: { estado?: Database["public"]["Enums"]["estado_evidencia"] };
        Relationships: [
          { foreignKeyName: "evidencias_ejecucion_id_fkey"; columns: ["ejecucion_id"]; isOneToOne: false; referencedRelation: "ejecuciones"; referencedColumns: ["id"] },
        ];
      };
      perfiles: {
        Row: { activo: boolean; correo: string | null; creado_en: string; empresa_id: string | null; id: string; nombre: string; rol: Database["public"]["Enums"]["rol_usuario"]; telefono: string | null };
        Insert: { activo?: boolean; correo?: string | null; empresa_id?: string | null; id: string; nombre?: string; rol?: Database["public"]["Enums"]["rol_usuario"]; telefono?: string | null };
        Update: { activo?: boolean; correo?: string | null; empresa_id?: string | null; nombre?: string; rol?: Database["public"]["Enums"]["rol_usuario"]; telefono?: string | null };
        Relationships: [
          { foreignKeyName: "perfiles_empresa_id_fkey"; columns: ["empresa_id"]; isOneToOne: false; referencedRelation: "empresas"; referencedColumns: ["id"] },
        ];
      };
      solicitudes: {
        Row: {
          actualizado_en: string; atendida_por: string | null; ciudades: string[]; comentarios: string | null; contacto_cargo: string | null;
          contacto_correo: string | null; contacto_empresa: string | null; contacto_nombre: string; contacto_telefono: string; creado_en: string;
          empresa_id: string | null; estado: Database["public"]["Enums"]["estado_solicitud"]; fecha_fin: string | null; fecha_inicio: string | null;
          fechas_flexibles: boolean; folio: string | null; horario: string | null; id: string; lineas: Database["public"]["Enums"]["linea_servicio"][];
          notas_internas: string | null; objetivo: string; origen: string; presupuesto: string | null; servicios: string[]; zonas: string | null;
          ubicacion_lat: number | null; ubicacion_lng: number | null; ubicacion_ref: string | null; radio_km: number | null; zonas_elegidas: string[];
          franja_id: string | null; dias_recorrido: number | null; escuelas: { nombre: string; lat: number; lng: number; radio_km: number }[] | null; fechas_reserva: string[];
        };
        Insert: { ciudades: string[]; contacto_nombre: string; contacto_telefono: string; objetivo: string; [k: string]: unknown };
        Update: { estado?: Database["public"]["Enums"]["estado_solicitud"]; notas_internas?: string | null; atendida_por?: string | null; empresa_id?: string | null };
        Relationships: [
          { foreignKeyName: "solicitudes_empresa_id_fkey"; columns: ["empresa_id"]; isOneToOne: false; referencedRelation: "empresas"; referencedColumns: ["id"] },
          { foreignKeyName: "solicitudes_franja_id_fkey"; columns: ["franja_id"]; isOneToOne: false; referencedRelation: "agenda_franjas"; referencedColumns: ["id"] },
        ];
      };
      unidades: {
        Row: { activa: boolean; capacidades: string[]; ciudad_base: string; creado_en: string; id: string; nombre: string; notas: string | null; placa: string | null; tipo: string };
        Insert: { activa?: boolean; capacidades?: string[]; ciudad_base: string; id?: string; nombre: string; notas?: string | null; placa?: string | null; tipo: string };
        Update: { activa?: boolean; capacidades?: string[]; ciudad_base?: string; nombre?: string; notas?: string | null; placa?: string | null; tipo?: string };
        Relationships: [];
      };
      zonas: {
        Row: { id: string; nombre: string; ciudad: string | null; contorno: [number, number][]; creado_en: string };
        Insert: { nombre: string; ciudad?: string | null; contorno: [number, number][] };
        Update: { nombre?: string; ciudad?: string | null; contorno?: [number, number][] };
        Relationships: [];
      };
    };
    Views: {
      v_tiempos_ejecucion: {
        Row: { ejecucion_id: string | null; fin: string | null; inicio: string | null; tiempo_efectivo: string | null; tiempo_pausado: string | null };
        Relationships: Rel[];
      };
    };
    Functions: {
      agenda_ocupacion: {
        Args: { p_desde: string; p_hasta: string };
        Returns: { fecha: string; franja_id: string; cupos: number; libres: number; bloqueado: boolean; reservas: { id: string; folio: string; estado: string; contacto: string }[] }[];
      };
      hoy_hn: { Args: never; Returns: string };
      convertir_solicitud: { Args: { p_empresa: string | null; p_empresa_nombre: string | null; p_nombre: string; p_solicitud: string }; Returns: string };
      es_staff: { Args: never; Returns: boolean };
      mis_solicitudes: { Args: never; Returns: { id: string; folio: string; estado: Database["public"]["Enums"]["estado_solicitud"]; objetivo: string; ciudades: string[]; creado_en: string }[] };
      recorrido_en_zonas: { Args: { p_ejecucion: string }; Returns: { lat: number; lng: number; capturado_en: string; zona: string }[] };
      cobertura_jornada: { Args: { p_ejecucion: string }; Returns: { zona: string; km: number; puntos: number; ultima: string }[] };
      punto_jornada: { Args: { p_ejecucion: string }; Returns: { lat: number; lng: number; registrado_en: string }[] };
      jornadas_en_curso_cliente: {
        Args: { p_campania: string };
        Returns: { id: string; fecha: string; linea: Database["public"]["Enums"]["linea_servicio"]; servicio: string; estado: Database["public"]["Enums"]["estado_ejecucion"]; zonas: string[]; punto_nombre: string | null; fotos_recibidas: number }[];
      };
      emitir_cotizacion: { Args: { p_id: string }; Returns: { id: string; numero: string | null; estado: Database["public"]["Enums"]["estado_cotizacion"]; version: number } };
      crear_revision_cotizacion: { Args: { p_id: string }; Returns: { id: string; numero: string | null; estado: Database["public"]["Enums"]["estado_cotizacion"]; version: number } };
      compartir_cotizacion: { Args: { p_id: string }; Returns: string };
      revocar_enlace_cotizacion: { Args: { p_id: string }; Returns: undefined };
      cancelar_cotizacion: { Args: { p_id: string }; Returns: undefined };
      marcar_cotizaciones_vencidas: { Args: never; Returns: number };
      cotizacion_publica: { Args: { p_token: string }; Returns: Json };
      mi_empresa: { Args: never; Returns: string };
      mi_rol: { Args: never; Returns: Database["public"]["Enums"]["rol_usuario"] };
    };
    Enums: {
      estado_campania: "borrador" | "cotizacion_enviada" | "aprobada" | "programada" | "en_ejecucion" | "finalizada" | "reportada" | "cancelada";
      estado_cotizacion: "borrador" | "emitida" | "compartida" | "vencida" | "cancelada";
      estado_ejecucion: "programada" | "en_curso" | "pausada" | "finalizada" | "validada" | "rechazada" | "incompleta";
      estado_evidencia: "pendiente" | "validada" | "rechazada";
      estado_solicitud: "nueva" | "en_revision" | "convertida" | "descartada";
      linea_servicio: "move" | "events" | "place";
      rol_usuario: "super_admin" | "admin" | "operador" | "cliente";
      tipo_evento: "inicio" | "pausa" | "reanudacion" | "fin" | "llegada" | "salida" | "instalacion" | "verificacion";
      tipo_evidencia: "foto" | "video";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type T = Database["public"]["Tables"];
export type Row<K extends keyof T> = T[K]["Row"];
export type Enum<K extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][K];
