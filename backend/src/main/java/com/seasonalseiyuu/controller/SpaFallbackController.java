package com.seasonalseiyuu.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Catch-all controller for SPA routing.
 * Forwards non-API, non-static-file requests to index.html so React Router can
 * handle them.
 * 
 * This uses a lower priority than static resource handling by virtue of
 * ResourceHandlerRegistry having higher priority.
 */
@Controller
public class SpaFallbackController {

    /**
     * Catch-all for SPA routes. Static resources (JS, CSS, images) are served by
     * Spring's static resource handler which has higher priority.
     * API routes are handled by @RestController endpoints which also have higher
     * priority.
     */
    @GetMapping(value = "/{path:[^\\.]*}")
    public String redirectRoot() {
        return "forward:/index.html";
    }

    @GetMapping(value = "/{path:[^\\.]*}/{subpath:[^\\.]*}")
    public String redirectSubPath() {
        return "forward:/index.html";
    }

    @GetMapping(value = "/{path:[^\\.]*}/{subpath:[^\\.]*}/{subsubpath:[^\\.]*}")
    public String redirectDeepPath() {
        return "forward:/index.html";
    }
}
