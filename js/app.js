'use strict';

/* =========================================================
   Mi Bolsillo – control de gastos personales
   JavaScript moderno (ES6+): let/const, template literals,
   arrow functions, destructuring y métodos de arreglos.
   ========================================================= */

/* ---------- 1. Constantes y estado ---------- */
const CLAVE_ALMACEN = 'mi-bolsillo:gastos:v1';
const CATEGORIAS = ['Comida', 'Transporte', 'Escuela', 'Entretenimiento', 'Salud', 'Servicios', 'Otros'];
const MONTO_MAXIMO = 1_000_000;
const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

let gastos = [];            // arreglo de objetos { id, descripcion, monto, categoria, fecha }
let idEnEdicion = null;     // id del gasto que se está editando (o null)
const filtros = { busqueda: '', categoria: 'todas', orden: 'fecha-desc' };

/* ---------- 2. Referencias al DOM ---------- */
const $ = (selector) => document.querySelector(selector);
const form = $('#form-gasto');
const campos = {
  descripcion: $('#descripcion'),
  monto: $('#monto'),
  fecha: $('#fecha'),
  categoria: $('#categoria'),
};
const btnGuardar = $('#btn-guardar');
const btnCancelar = $('#btn-cancelar');
const mensaje = $('#mensaje');
const cuerpoTabla = $('#cuerpo-tabla');
const bloqueVacio = $('#vacio');
const textoVacio = $('#texto-vacio');
const btnEjemplos = $('#btn-ejemplos');

/* ---------- 3. Utilidades ---------- */
const hoyISO = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const nuevoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const formatearFecha = (iso) => {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
};

const redondear = (n) => Math.round(n * 100) / 100;

const esFechaValida = (texto) => /^\d{4}-\d{2}-\d{2}$/.test(texto) && !Number.isNaN(Date.parse(texto));

/* ---------- 4. Persistencia con localStorage ---------- */
const esGastoValido = (g) =>
  g && typeof g === 'object' &&
  typeof g.id === 'string' &&
  typeof g.descripcion === 'string' &&
  typeof g.monto === 'number' && Number.isFinite(g.monto) && g.monto > 0 &&
  CATEGORIAS.includes(g.categoria) &&
  typeof g.fecha === 'string' && esFechaValida(g.fecha);

const cargarGastos = () => {
  try {
    const crudo = localStorage.getItem(CLAVE_ALMACEN);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? datos.filter(esGastoValido) : [];
  } catch (error) {
    console.warn('No se pudieron leer los datos guardados:', error);
    return [];
  }
};

const guardarGastos = () => {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(gastos));
    return true;
  } catch (error) {
    console.warn('No se pudo guardar en localStorage:', error);
    mostrarMensaje('No se pudo guardar en este navegador (almacenamiento no disponible).', 'mal');
    return false;
  }
};

/* ---------- 5. Validación ---------- */
const validar = ({ descripcion, monto, fecha, categoria }) => {
  const errores = {};
  if (descripcion.length < 3) errores.descripcion = 'Escribe al menos 3 caracteres.';
  else if (descripcion.length > 60) errores.descripcion = 'Máximo 60 caracteres.';

  if (monto === '' || Number.isNaN(Number(monto))) errores.monto = 'Escribe un monto numérico.';
  else if (Number(monto) <= 0) errores.monto = 'El monto debe ser mayor que cero.';
  else if (Number(monto) > MONTO_MAXIMO) errores.monto = `El monto no puede superar ${formatoMoneda.format(MONTO_MAXIMO)}.`;

  if (!fecha || !esFechaValida(fecha)) errores.fecha = 'Elige una fecha válida.';
  else if (fecha > hoyISO()) errores.fecha = 'La fecha no puede ser futura.';

  if (!CATEGORIAS.includes(categoria)) errores.categoria = 'Elige una categoría.';
  return errores;
};

const mostrarErrores = (errores) => {
  Object.keys(campos).forEach((nombre) => {
    const texto = errores[nombre] ?? '';
    $(`#error-${nombre}`).textContent = texto;
    campos[nombre].classList.toggle('invalido', Boolean(texto));
    campos[nombre].setAttribute('aria-invalid', texto ? 'true' : 'false');
  });
};

let temporizadorMensaje;
const mostrarMensaje = (texto, tipo = 'ok') => {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => { mensaje.textContent = ''; mensaje.className = 'mensaje'; }, 4000);
};

/* ---------- 6. Operaciones CRUD ---------- */
const leerFormulario = () => ({
  descripcion: campos.descripcion.value.trim(),
  monto: campos.monto.value.trim(),
  fecha: campos.fecha.value,
  categoria: campos.categoria.value,
});

const agregarGasto = (datos) => {
  gastos.push({ id: nuevoId(), ...datos, monto: redondear(Number(datos.monto)) });
};

const editarGasto = (id, datos) => {
  gastos = gastos.map((g) => (g.id === id ? { ...g, ...datos, monto: redondear(Number(datos.monto)) } : g));
};

const eliminarGasto = (id) => {
  gastos = gastos.filter((g) => g.id !== id);
};

/* ---------- 7. Modo edición del formulario ---------- */
const limpiarFormulario = () => {
  form.reset();
  campos.fecha.value = hoyISO();
  mostrarErrores({});
};

const salirDeEdicion = () => {
  idEnEdicion = null;
  $('#titulo-form').textContent = 'Nuevo gasto';
  btnGuardar.textContent = 'Agregar gasto';
  btnCancelar.hidden = true;
  limpiarFormulario();
};

const entrarEnEdicion = (id) => {
  const gasto = gastos.find((g) => g.id === id);
  if (!gasto) return;
  idEnEdicion = id;
  campos.descripcion.value = gasto.descripcion;
  campos.monto.value = gasto.monto;
  campos.fecha.value = gasto.fecha;
  campos.categoria.value = gasto.categoria;
  mostrarErrores({});
  mensaje.textContent = '';
  $('#titulo-form').textContent = 'Editar gasto';
  btnGuardar.textContent = 'Guardar cambios';
  btnCancelar.hidden = false;
  campos.descripcion.focus();
  renderizar();
};

/* ---------- 8. Filtrado y ordenamiento ---------- */
const obtenerGastosVisibles = () => {
  const texto = filtros.busqueda.toLowerCase();
  const visibles = gastos
    .filter((g) => filtros.categoria === 'todas' || g.categoria === filtros.categoria)
    .filter((g) => g.descripcion.toLowerCase().includes(texto));

  const [campo, sentido] = filtros.orden.split('-');
  const factor = sentido === 'asc' ? 1 : -1;
  return [...visibles].sort((a, b) =>
    campo === 'monto' ? (a.monto - b.monto) * factor : a.fecha.localeCompare(b.fecha) * factor);
};

/* ---------- 9. Renderizado de la interfaz ---------- */
const crearCelda = (texto, clase) => {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
};

const crearBoton = (texto, clase, alHacerClic) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn chico ${clase}`.trim();
  b.textContent = texto;
  b.addEventListener('click', alHacerClic);
  return b;
};

const renderizarTabla = (visibles) => {
  cuerpoTabla.replaceChildren();
  visibles.forEach((g) => {
    const fila = document.createElement('tr');
    if (g.id === idEnEdicion) fila.classList.add('editando');

    const celdaCategoria = document.createElement('td');
    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta';
    etiqueta.textContent = g.categoria;
    celdaCategoria.append(etiqueta);

    const celdaAcciones = document.createElement('td');
    celdaAcciones.append(
      crearBoton('Editar', '', () => entrarEnEdicion(g.id)),
      ' ',
      crearBoton('Eliminar', 'peligro', () => confirmarEliminacion(g)),
    );

    fila.append(
      crearCelda(formatearFecha(g.fecha)),
      crearCelda(g.descripcion),
      celdaCategoria,
      crearCelda(formatoMoneda.format(g.monto), 'num'),
      celdaAcciones,
    );
    cuerpoTabla.append(fila);
  });

  const hayVisibles = visibles.length > 0;
  bloqueVacio.hidden = hayVisibles;
  if (!hayVisibles) {
    const sinDatos = gastos.length === 0;
    textoVacio.textContent = sinDatos
      ? 'Aún no hay gastos registrados. Agrega el primero con el formulario.'
      : 'Ningún gasto coincide con la búsqueda o el filtro.';
    btnEjemplos.hidden = !sinDatos;
  }
};

const renderizarResumen = (visibles) => {
  const total = visibles.reduce((suma, g) => suma + g.monto, 0);
  const promedio = visibles.length ? total / visibles.length : 0;
  const mayor = visibles.reduce((max, g) => (g.monto > max ? g.monto : max), 0);

  const datosResumen = [
    ['Total', formatoMoneda.format(total)],
    ['Gastos', String(visibles.length)],
    ['Promedio', formatoMoneda.format(promedio)],
    ['Gasto mayor', formatoMoneda.format(mayor)],
  ];
  $('#resumen').replaceChildren(...datosResumen.map(([titulo, valor]) => {
    const div = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = titulo;
    dd.textContent = valor;
    div.append(dt, dd);
    return div;
  }));

  const porCategoria = visibles.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto;
    return acc;
  }, {});
  const lista = $('#lista-categorias');
  lista.replaceChildren();
  Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .forEach(([nombre, suma]) => {
      const porcentaje = total ? (suma / total) * 100 : 0;
      const li = document.createElement('li');
      const linea = document.createElement('div');
      linea.className = 'linea';
      const izq = document.createElement('span');
      izq.textContent = nombre;
      const der = document.createElement('span');
      der.textContent = `${formatoMoneda.format(suma)} (${porcentaje.toFixed(0)}%)`;
      linea.append(izq, der);
      const barra = document.createElement('div');
      barra.className = 'barra';
      const relleno = document.createElement('span');
      relleno.style.width = `${porcentaje}%`;
      barra.append(relleno);
      li.append(linea, barra);
      lista.append(li);
    });
  if (!Object.keys(porCategoria).length) {
    const li = document.createElement('li');
    li.textContent = 'Sin datos para mostrar.';
    lista.append(li);
  }
};

const renderizar = () => {
  const visibles = obtenerGastosVisibles();
  renderizarTabla(visibles);
  renderizarResumen(visibles);
};

/* ---------- 10. Manejadores de eventos ---------- */
const confirmarEliminacion = (gasto) => {
  const texto = `¿Eliminar "${gasto.descripcion}" por ${formatoMoneda.format(gasto.monto)}?`;
  if (!window.confirm(texto)) return;
  eliminarGasto(gasto.id);
  if (idEnEdicion === gasto.id) salirDeEdicion();
  if (guardarGastos()) mostrarMensaje('Gasto eliminado.');
  renderizar();
};

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const datos = leerFormulario();
  const errores = validar(datos);
  mostrarErrores(errores);

  const primerCampoConError = Object.keys(campos).find((n) => errores[n]);
  if (primerCampoConError) {
    campos[primerCampoConError].focus();
    mostrarMensaje('Revisa los campos marcados.', 'mal');
    return;
  }

  const editando = idEnEdicion !== null;
  if (editando) editarGasto(idEnEdicion, datos);
  else agregarGasto(datos);

  if (guardarGastos()) mostrarMensaje(editando ? 'Cambios guardados.' : 'Gasto agregado.');
  salirDeEdicion();
  renderizar();
});

btnCancelar.addEventListener('click', () => {
  salirDeEdicion();
  renderizar();
  mostrarMensaje('Edición cancelada.');
});

$('#busqueda').addEventListener('input', (e) => { filtros.busqueda = e.target.value.trim(); renderizar(); });
$('#filtro-categoria').addEventListener('change', (e) => { filtros.categoria = e.target.value; renderizar(); });
$('#orden').addEventListener('change', (e) => { filtros.orden = e.target.value; renderizar(); });

btnEjemplos.addEventListener('click', () => {
  const hoy = new Date();
  const haceDias = (n) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  [
    ['Tacos del comedor', 65, 'Comida', 0],
    ['Camión a la facultad', 24, 'Transporte', 1],
    ['Copias del laboratorio', 38.5, 'Escuela', 2],
    ['Cine con amigos', 120, 'Entretenimiento', 4],
    ['Internet del mes', 389, 'Servicios', 6],
    ['Farmacia', 94.9, 'Salud', 8],
  ].forEach(([descripcion, monto, categoria, dias]) =>
    agregarGasto({ descripcion, monto, categoria, fecha: haceDias(dias) }));
  if (guardarGastos()) mostrarMensaje('Se cargaron datos de ejemplo.');
  renderizar();
});

/* ---------- 11. Inicio ---------- */
const llenarSelectores = () => {
  campos.categoria.replaceChildren(...[['', 'Elige una categoría'], ...CATEGORIAS.map((c) => [c, c])]
    .map(([valor, texto]) => new Option(texto, valor)));
  $('#filtro-categoria').replaceChildren(...[['todas', 'Todas'], ...CATEGORIAS.map((c) => [c, c])]
    .map(([valor, texto]) => new Option(texto, valor)));
};

const iniciar = () => {
  llenarSelectores();
  campos.fecha.max = hoyISO();
  campos.fecha.value = hoyISO();
  gastos = cargarGastos();
  renderizar();
};

iniciar();
