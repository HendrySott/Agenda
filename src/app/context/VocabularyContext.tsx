import React, { createContext, useContext, useMemo } from 'react';
// @ts-expect-error módulo JS compartido con el servidor
import { buildVocabulary } from '../../../shared/businessTypes.js';

export interface Noun {
  one: string;
  many: string;
  gender: 'm' | 'f';
}

export interface Vocabulary {
  typeId: string;
  employee: Noun;
  client: Noun;
  appointment: Noun;
  employeeLower: string;
  employeesLower: string;
  clientLower: string;
  clientsLower: string;
  appointmentLower: string;
  appointmentsLower: string;
  new: (n: Noun) => string;
  all: (n: Noun) => string;
  this: (n: Noun) => string;
  the: (n: Noun) => string;
  assigned: (n: Noun) => string;
  selected: (n: Noun) => string;
}

const VocabularyContext = createContext<Vocabulary>(buildVocabulary('general'));

export function VocabularyProvider({ typeId, children }: { typeId?: string; children: React.ReactNode }) {
  const vocabulary = useMemo<Vocabulary>(() => buildVocabulary(typeId), [typeId]);
  return <VocabularyContext.Provider value={vocabulary}>{children}</VocabularyContext.Provider>;
}

/** Vocabulario del negocio actual: empleado/cliente/cita según el tipo de negocio. */
export function useVocabulary() {
  return useContext(VocabularyContext);
}
