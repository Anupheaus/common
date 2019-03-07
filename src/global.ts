import { expect as chaiExpect } from 'chai';

declare global {
  export const expect: typeof chaiExpect;
}
