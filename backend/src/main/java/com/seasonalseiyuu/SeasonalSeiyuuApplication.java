package com.seasonalseiyuu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.seasonalseiyuu.config.JikanProperties;
import com.seasonalseiyuu.config.RefreshProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({RefreshProperties.class, JikanProperties.class})
public class SeasonalSeiyuuApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeasonalSeiyuuApplication.class, args);
    }
}
