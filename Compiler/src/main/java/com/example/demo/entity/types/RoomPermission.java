package com.example.demo.entity.types;

/**
 * Access control permissions assigned to collaborative room members.
 */
public enum RoomPermission {
    /** Viewer only: read-only access (cannot edit, cannot run). */
    READ,

    /** Editor: collaborative code editing enabled (running code restricted). */
    WRITE,

    /** Runner: full collaborative code editing and execution privileges. */
    EXECUTE
}
