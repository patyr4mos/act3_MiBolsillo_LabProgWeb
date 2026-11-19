# Guion de la demostración (3 minutos)

Antes de empezar: abre `index.html` en Chrome con la lista vacía (para limpiar los datos, abre las DevTools con F12 → Application → Local Storage → borra la clave `mi-bolsillo:gastos:v1` y recarga).

| Tiempo | Qué mostrar | Qué decir |
|--------|-------------|-----------|
| 0:00 – 0:20 | Pantalla inicial vacía | "Es Mi Bolsillo, un control de gastos que funciona solo en el navegador, sin servidor. Los datos se guardan con localStorage." |
| 0:20 – 0:50 | Pulsar **Agregar gasto** sin llenar nada; después escribir monto `-5` | "Antes de guardar se valida: descripción de 3 a 60 caracteres, monto mayor que cero, fecha no futura y categoría obligatoria. Los mensajes salen junto a cada campo." |
| 0:50 – 1:20 | Agregar 2 o 3 gastos reales (por ejemplo tacos $65.50, camión $24, copias $38.50) | "Cada gasto es un objeto dentro de un arreglo. Al agregarlo, la tabla y el resumen se actualizan sin recargar la página: eso lo hace la función `renderizar()` manipulando el DOM." |
| 1:20 – 1:45 | Señalar el **Resumen** | "El total, el promedio, el gasto mayor y el gasto por categoría se calculan automáticamente con `reduce`." |
| 1:45 – 2:15 | **Editar** un gasto, cambiar el monto y guardar; después **Eliminar** otro (mostrar la confirmación) | "Al editar, el formulario se llena con los datos y la fila queda marcada. Eliminar pide confirmación." |
| 2:15 – 2:40 | Escribir en **Buscar**, cambiar el **filtro por categoría** y **Ordenar por monto** | "Como función adicional agregué búsqueda, filtro y ordenamiento con `filter` y `sort`. El resumen se ajusta a lo que se está viendo." |
| 2:40 – 3:00 | **Recargar la página (F5)** y, si da tiempo, abrir DevTools → Application → Local Storage | "Al recargar, los datos siguen ahí porque se leen de localStorage. Si el dato estuviera dañado, la aplicación lo descarta y arranca vacía en lugar de fallar. Gracias." |

Consejo: si algo sale mal en vivo, el botón **Cargar datos de ejemplo** (aparece con la lista vacía) deja la aplicación lista en un clic.
