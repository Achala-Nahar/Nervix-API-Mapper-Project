package com.nervix.platform.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI nervixOpenApi() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("Nervix API")
                                .version("v1")
                                .description("Enterprise knowledge graph platform API")
                )
                .components(
                        new Components()
                                .addSecuritySchemes(
                                        "supabaseBearer",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                )
                .addSecurityItem(
                        new SecurityRequirement()
                                .addList("supabaseBearer")
                );
    }
}