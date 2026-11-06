// Files in public/assets. BASE_URL is /tv/ in the build the api serves and / in dev (ADR-026).
export const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`
