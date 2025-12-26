package com.seasonalseiyuu.model;

import java.time.Instant;
import java.util.Map;

/**
 * Represents the cached season data stored in JSON.
 */
public record SeasonCache(String season,int year,Instant lastRefreshed,Map<Integer,VoiceActor>voiceActors // keyed by
                                                                                                          // malId
){}
