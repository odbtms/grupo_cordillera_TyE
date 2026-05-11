package com.grupocordillera.kpis.config;

import com.grupocordillera.kpis.model.Kpi;
import com.grupocordillera.kpis.repository.KpiRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class KpiDataInitializer {

    @Bean
    public CommandLineRunner initData(KpiRepository kpiRepository) {
        return args -> {
            if (kpiRepository.count() == 0) {
                kpiRepository.saveAll(List.of(
                    new Kpi(null, "Efectividad de Ventas", "Ventas / Visitas", 0.0, 0.0, LocalDateTime.now()),
                    new Kpi(null, "Crecimiento Mensual", "(Mes Actual - Mes Anterior) / Mes Anterior", 0.0, 0.0, LocalDateTime.now()),
                    new Kpi(null, "Meta de Ventas Diarias", "Monto Diario > 1000", 0.0, 0.0, LocalDateTime.now()),
                    new Kpi(null, "Ticket Promedio", "Ingresos / Total Transacciones", 0.0, 0.0, LocalDateTime.now())
                ));
            }
        };
    }
}
