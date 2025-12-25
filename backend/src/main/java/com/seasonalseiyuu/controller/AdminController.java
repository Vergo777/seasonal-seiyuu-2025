package com.seasonalseiyuu.controller;

import com.seasonalseiyuu.service.SeasonDataService;
import com.seasonalseiyuu.service.SeasonDataService.RefreshStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for admin endpoints (protected by API key).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final SeasonDataService seasonDataService;

    public AdminController(SeasonDataService seasonDataService) {
        this.seasonDataService = seasonDataService;
    }

    /**
     * Trigger a data refresh.
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> triggerRefresh() {
        boolean started = seasonDataService.startRefresh();

        if (started) {
            return ResponseEntity.accepted().body(Map.of(
                    "status", "started",
                    "message", "Data refresh started. Check /api/admin/refresh/status for progress."));
        } else {
            return ResponseEntity.ok(Map.of(
                    "status", "already_running",
                    "message", "A refresh is already in progress."));
        }
    }

    /**
     * Get refresh status.
     */
    @GetMapping("/refresh/status")
    public ResponseEntity<RefreshStatus> getRefreshStatus() {
        return ResponseEntity.ok(seasonDataService.getRefreshStatus());
    }
}
