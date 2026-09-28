// Generado desde Supabase (proyecto publicalle). Regenerar si cambia el esquema.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
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
        };
        Insert: { ciudades: string[]; contacto_nombre: string; contacto_telefono: string; objetivo: string; [k: string]: unknown };
        Update: { estado?: Database["public"]["Enums"]["estado_solicitud"]; notas_internas?: string | null; atendida_por?: string | null; empresa_id?: string | null };
        Relationships: [
          { foreignKeyName: "solicitudes_empresa_id_fkey"; columns: ["empresa_id"]; isOneToOne: false; referencedRelation: "empresas"; referencedColumns: ["id"] },
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
      convertir_solicitud: { Args: { p_empresa: string | null; p_empresa_nombre: string | null; p_nombre: string; p_solicitud: string }; Returns: string };
      es_staff: { Args: never; Returns: boolean };
      recorrido_en_zonas: { Args: { p_ejecucion: string }; Returns: { lat: number; lng: number; capturado_en: string; zona: string }[] };
      cobertura_jornada: { Args: { p_ejecucion: string }; Returns: { zona: string; km: number; puntos: number; ultima: string }[] };
      punto_jornada: { Args: { p_ejecucion: string }; Returns: { lat: number; lng: number; registrado_en: string }[] };
      jornadas_en_curso_cliente: {
        Args: { p_campania: string };
        Returns: { id: string; fecha: string; linea: Database["public"]["Enums"]["linea_servicio"]; servicio: string; estado: Database["public"]["Enums"]["estado_ejecucion"]; zonas: string[]; punto_nombre: string | null; fotos_recibidas: number }[];
      };
      mi_empresa: { Args: never; Returns: string };
      mi_rol: { Args: never; Returns: Database["public"]["Enums"]["rol_usuario"] };
    };
    Enums: {
      estado_campania: "borrador" | "cotizacion_enviada" | "aprobada" | "programada" | "en_ejecucion" | "finalizada" | "reportada" | "cancelada";
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
