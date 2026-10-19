package com.nervix.platform;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@ActiveProfiles("test")
@SpringBootTest
class NervixApplicationTests {

    @MockitoBean
    private Neo4jClient neo4jClient;

    @Test
    void applicationContextLoads() {
    }
}
