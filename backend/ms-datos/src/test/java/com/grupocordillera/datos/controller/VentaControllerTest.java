package com.grupocordillera.datos.controller;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.grupocordillera.datos.model.Venta;
import com.grupocordillera.datos.repository.VentaRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class VentaControllerTest {

    @Mock
    private VentaRepository repository;

    @InjectMocks
    private VentaController controller;

    @Test
    void asignaFechaSiNoVieneEnElPayload() {
        Venta venta = new Venta();
        venta.setFechaVenta(null);
        venta.setMontoTotal(1000.0);

        when(repository.save(any(Venta.class))).thenAnswer(invocation -> invocation.getArgument(0));

        controller.registrarVenta(venta);

        ArgumentCaptor<Venta> captor = ArgumentCaptor.forClass(Venta.class);
        verify(repository).save(captor.capture());
        LocalDateTime fecha = captor.getValue().getFechaVenta();
        assertNotNull(fecha);
    }
}
