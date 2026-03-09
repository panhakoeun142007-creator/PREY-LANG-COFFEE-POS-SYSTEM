// Type declarations for JavaScript modules
declare module '*.jsx' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '*.js' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}
