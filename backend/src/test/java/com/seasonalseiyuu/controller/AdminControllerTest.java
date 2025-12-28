package com.seasonalseiyuu.controller;

import com.seasonalseiyuu.config.AdminApiKeyFilter;
import com.seasonalseiyuu.service.SeasonDataService;
import com.seasonalseiyuu.service.SeasonDataService.RefreshStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AdminController.
 * Tests API key authentication and admin endpoints.
 */
@WebMvcTest(AdminController.class)
@Import(AdminApiKeyFilter.class)
@TestPropertySource(properties = "admin.api-key=test-secret-key")
class AdminControllerTest {

    private static final String VALID_API_KEY = "test-secret-key";
    private static final String INVALID_API_KEY = "wrong-key";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SeasonDataService seasonDataService;

    @Test
    void refresh_requiresApiKey() throws Exception {
        // When & Then - No API key provided
        mockMvc.perform(post("/api/admin/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Unauthorized")));
    }

    @Test
    void refresh_rejectsInvalidApiKey() throws Exception {
        // When & Then - Wrong API key provided
        mockMvc.perform(post("/api/admin/refresh")
                .header("X-API-Key", INVALID_API_KEY))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Unauthorized")));
    }

    @Test
    void refresh_startsRefreshWithValidKey() throws Exception {
        // Given
        when(seasonDataService.startRefresh()).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/admin/refresh")
                .header("X-API-Key", VALID_API_KEY))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status", is("started")))
                .andExpect(jsonPath("$.message", containsString("refresh started")));
    }

    @Test
    void refresh_returnsAlreadyRunningWhenInProgress() throws Exception {
        // Given
        when(seasonDataService.startRefresh()).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/admin/refresh")
                .header("X-API-Key", VALID_API_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("already_running")));
    }

    @Test
    void refreshStatus_requiresApiKey() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/admin/refresh/status"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshStatus_returnsCurrentProgress() throws Exception {
        // Given
        RefreshStatus status = new RefreshStatus(true, "Fetching characters...", 45, 100);
        when(seasonDataService.getRefreshStatus()).thenReturn(status);

        // When & Then
        mockMvc.perform(get("/api/admin/refresh/status")
                .header("X-API-Key", VALID_API_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inProgress", is(true)))
                .andExpect(jsonPath("$.message", is("Fetching characters...")))
                .andExpect(jsonPath("$.current", is(45)))
                .andExpect(jsonPath("$.total", is(100)));
    }

    @Test
    void refreshStatus_returnsIdleWhenNotRunning() throws Exception {
        // Given
        RefreshStatus status = new RefreshStatus(false, "Complete", 100, 100);
        when(seasonDataService.getRefreshStatus()).thenReturn(status);

        // When & Then
        mockMvc.perform(get("/api/admin/refresh/status")
                .header("X-API-Key", VALID_API_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inProgress", is(false)))
                .andExpect(jsonPath("$.message", is("Complete")));
    }
}
