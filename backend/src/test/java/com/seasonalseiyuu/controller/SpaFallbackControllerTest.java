package com.seasonalseiyuu.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for SpaFallbackController which forwards SPA routes to index.html.
 */
@WebMvcTest(SpaFallbackController.class)
class SpaFallbackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void singleSegmentPath_forwardsToIndex() throws Exception {
        mockMvc.perform(get("/about"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void twoSegmentPath_forwardsToIndex() throws Exception {
        mockMvc.perform(get("/va/12345"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void threeSegmentPath_forwardsToIndex() throws Exception {
        mockMvc.perform(get("/some/deep/route"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void pathWithDot_notForwarded() throws Exception {
        // Paths with dots (like file.js) should not match the pattern
        // They would fall through to static resource handler
        mockMvc.perform(get("/assets/file.js"))
                .andExpect(status().isNotFound()); // No matching route
    }
}
