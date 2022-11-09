import { expect as ExpectChai } from 'chai';

declare global {
  export const expect: typeof ExpectChai;
}
