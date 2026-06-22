export function setupLogger(name: string = 'olm_tests') {
  return {
    info: (msg: string) => console.log(`${new Date().toISOString()} | INFO     | ${name} | ${msg}`),
    error: (msg: string) => console.error(`${new Date().toISOString()} | ERROR    | ${name} | ${msg}`),
    warning: (msg: string) => console.warn(`${new Date().toISOString()} | WARNING  | ${name} | ${msg}`),
  };
}
