const CONFIG_FILTROS = {
    'guayos': ['Adidas', 'Nike', 'Puma', 'Mizuno', 'Aluminio'],
    'sintetica': ['Adidas', 'Nike', 'Puma', 'Mizuno'],
    'futsal': ['Adidas', 'Nike', 'Joma'],
    'guantes': ['CEY', 'FADSPORT', 'OTRA'],
    'accesorios': ['Antideslizante', 'Canilleras', 'Perneras', 'Mangas', 'Cinta Cohesiva']
};

let todosLosProductos = [], catAct = 'guayos', subFiltroAct = '', precioFiltro = 'todos', productoSeleccionado = {};
const REPO_OWNER = "guayoscey-bot";
const REPO_NAME = "ceysport";
const BRANCH = "main";

async function cargar() {
    try {
        const urlApi = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/content/productos?ref=${BRANCH}`;
        const respuesta = await fetch(urlApi);
        if (!respuesta.ok) throw new Error('No se pudo conectar con el repositorio');

        const files = await respuesta.json();
        if (!files || files.length === 0) {
            document.getElementById('lista').innerHTML = '<p style="grid-column: 1/-1; color:white; text-align:center;">No hay productos creados todavía. Entra a <a href="/admin/" style="color:var(--gold);">/admin</a> para agregar el primero.</p>';
            return;
        }

        todosLosProductos = [];
        for (const file of files) {
            if (file.name.endsWith('.json')) {
                const fileRes = await fetch(file.download_url);
                const data = await fileRes.json();
                todosLosProductos.push({
                    id: file.name.replace('.json', ''),
                    ...data
                });
            }
        }

        // Simular clic inicial en la categoría Guayos
        const primerBoton = document.querySelector('.nav-bar button');
        if (primerBoton) filtrar('guayos', primerBoton);

    } catch (e) {
        console.error("Error cargando productos:", e);
        document.getElementById('lista').innerHTML = '<p style="grid-column: 1/-1; color:white; text-align:center;">Error al cargar los productos. Asegúrate de crear al menos uno desde el panel /admin.</p>';
    }
}

function filtrar(cat, btn) {
    catAct = cat; subFiltroAct = ''; precioFiltro = 'todos';
    document.getElementById('selectPrecio').value = 'todos';
    document.getElementById('filtro-precio').style.display = (cat === 'accesorios' || cat === 'guantes') ? 'none' : 'flex';
    document.querySelectorAll('.nav-bar button').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    document.getElementById('subfiltros').innerHTML = (CONFIG_FILTROS[cat] || []).map(o => `<button onclick="filtrarSub('${o}', this)">${o}</button>`).join('');
    aplicarFiltros();
}

function filtrarSub(valor, btn) {
    subFiltroAct = valor;
    document.querySelectorAll('.sub-nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    aplicarFiltros();
}

function filtrarPorPrecio(valor) {
    precioFiltro = valor;
    aplicarFiltros();
}

function aplicarFiltros() {
    let filtrados = todosLosProductos.filter(p => p.Categoria?.toLowerCase().trim() === catAct.toLowerCase().trim());
    if (subFiltroAct) {
        filtrados = filtrados.filter(p => p.Marca?.toLowerCase().trim() === subFiltroAct.toLowerCase().trim());
    }
    if (precioFiltro !== 'todos' && catAct !== 'accesorios' && catAct !== 'guantes') {
        const [min, max] = precioFiltro.split('-').map(Number);
        filtrados = filtrados.filter(p => Number(p.precio) >= min && Number(p.precio) <= max);
    }
    renderizar(filtrados);
}

function renderizar(prods) {
    const lista = document.getElementById('lista');
    lista.innerHTML = prods.length === 0 ? '<p style="grid-column: 1/-1; color:white; text-align:center;">No hay productos con estos filtros.</p>' : prods.map(p => `
        <div class="card">
            <img src="${p.imagen_url || 'https://via.placeholder.com/300'}" alt="${p.nombre}">
            <h3>${p.nombre.toUpperCase()}</h3>
            <p class="desc-text">${p.descripcion || ''}</p>
            <p class="price-text">$${parseInt(p.precio || 0).toLocaleString('es-CO').replace(/,/g, ".")}</p>
            <select class="tallas-select" id="talla-${p.id}">
                ${(p.tallas ? p.tallas.split(',') : ['Única']).map(t => `<option value="${t.trim()}">${t.trim()}</option>`).join('')}
            </select>
            ${['guayos', 'sintetica', 'futsal'].includes(p.Categoria?.toLowerCase().trim()) ? `<a class="guia-tallas" onclick="abrirGuiaTallas()">Ver Guía de Tallas</a>` : ''}
            <button class="btn-action" onclick="abrirPedido('${p.id}', '${p.nombre.replace(/'/g, "\\'")}', 'talla-${p.id}')">PEDIR POR WHATSAPP</button>
        </div>`).join('');
}

function abrirPedido(id, nombre, tallaId) {
    productoSeleccionado = { nombre, talla: document.getElementById(tallaId).value };
    document.getElementById('modalPedido').style.display = 'flex';
}

function cerrarPedido() { document.getElementById('modalPedido').style.display = 'none'; }
function cerrarGuiaTallas() { document.getElementById('modalTallas').style.display = 'none'; }
function abrirGuiaTallas() { document.getElementById('modalTallas').style.display = 'flex'; }

document.getElementById('formPedido').addEventListener('submit', function(e) {
    e.preventDefault();
    const msg = `*NUEVO PEDIDO - CEY SPORT*%0A%0A*Producto:* ${productoSeleccionado.nombre.toUpperCase()}%0A*Talla:* ${productoSeleccionado.talla}%0A%0A*Datos del cliente:*%0ANombre: ${document.getElementById('pNombre').value}%0ACC/TI: ${document.getElementById('pDoc').value}%0ACiudad: ${document.getElementById('pCiudad').value}%0ADirección: ${document.getElementById('pDir').value}%0ATeléfono: ${document.getElementById('pTel').value}`;
    window.open(`https://wa.me/573242445670?text=${msg}`);
    this.reset();
    cerrarPedido();
});

cargar();
