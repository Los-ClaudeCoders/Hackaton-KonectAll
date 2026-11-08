-- Limpieza de datos de prueba de Playwright / e2e
delete from public.publicaciones where titulo like 'E2E %';

-- Los usuarios de Auth de prueba no se pueden borrar desde SQL (requieren service role).
-- Si quieres eliminarlos del todo, hazlo desde Authentication -> Users en el dashboard.
