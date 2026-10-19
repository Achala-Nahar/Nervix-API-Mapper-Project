package com.nervix.platform.common.api;
import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
class ApiResponseTest {
 @Test void createsStandardSuccessEnvelope(){var response=ApiResponse.success("value","ok","trace");assertThat(response.success()).isTrue();assertThat(response.data()).isEqualTo("value");assertThat(response.traceId()).isEqualTo("trace");}
 @Test void createsStandardFailureEnvelope(){var response=ApiResponse.failure("bad","trace");assertThat(response.success()).isFalse();assertThat(response.data()).isNull();}
}
