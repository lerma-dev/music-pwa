let ContentToast = document.getElementById("content-toast");

const agregarToast = ({ tipo, titulo, descripcion, autoClose }) => {    
    const numAzar = Math.floor(Math.random() * 100);
    const fecha = Date.now();
    const toastId = fecha + numAzar;
    
    const Toast = document.createElement("div");
    Toast.classList.add("toast");
    Toast.id = toastId;

    if (tipo === "Exito" || tipo === "Error") {
        Toast.classList.add(tipo.toLowerCase());
    }

    if(autoClose){
        Toast.classList.add("auto_close");
        setTimeout(() => {
            closeToast(toastId);
        }, 3000);
    }

    //Iconos
    const iconos = {
        Exito: '<l-icon name="sucess"></l-icon>',
        Error: '<l-icon name="alert"></l-icon>'
    };

    //Plantilla
    const toast = `
    <div class="content-info">
        
        <div class="type-icon">
            ${iconos[tipo]}
        </div>
        
        <div class="texto">
            <h3 class="titulo">${titulo}</h3>
            <p class="descripcion">${descripcion}</p>
        </div>
    </div>
    
    <button class="btn_close"> 
        <div class="icono">
            <l-icon name="close"></l-icon>
        </div>
    </button> `;

    //Agregar la plantilla al nuevo toast
    Toast.innerHTML = toast;

    //Agregar el nuevo toast al contenedor
    ContentToast.appendChild(Toast);

    //Funcion para manejar el cierre de la animacion
    const AnimacionCierre = (e) => {
        if(e.animationName === 'cierre'){
            Toast.removeEventListener("animationend", AnimacionCierre);
            Toast.remove();
        }
    }
    
    //Agregamos un Evento de escuhar para dectectar cuando termine la animacion
    Toast.addEventListener("animationend", AnimacionCierre);
}

//Evento para dectectar click en los toast
ContentToast.addEventListener("click", (e) => {
    const toastId = e.target.closest("div.toast")?.id;
    if (e.target.closest('button.btn_close')) {
        closeToast(toastId);
    }
});

//Funcion para cerrar el toast
const closeToast = (id) => {
    document.getElementById(id)?.classList.add("cerrando");
}
