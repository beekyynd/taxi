import { ReactNode } from 'react';
import { HomeLocation, WorkLocation } from '@utils/icons';

export const savedLocationData: Array<{
  id: number;
  title: string;
  number: string;
  pickUpLocation: string;
  dropLocation: string;
  icon: ReactNode;
}> = [];
