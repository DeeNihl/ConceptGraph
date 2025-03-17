-- Table: omop_vocab.relationship

-- DROP TABLE IF EXISTS omop_vocab.relationship;

CREATE TABLE IF NOT EXISTS omop_vocab.relationship
(
    relationship_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    relationship_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    is_hierarchical character varying(1) COLLATE pg_catalog."default" NOT NULL,
    defines_ancestry character varying(1) COLLATE pg_catalog."default" NOT NULL,
    reverse_relationship_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    relationship_concept_id integer NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.relationship
    OWNER to postgres;
-- Index: idx_relationship_rel_id

-- DROP INDEX IF EXISTS omop_vocab.idx_relationship_rel_id;

CREATE INDEX IF NOT EXISTS idx_relationship_rel_id
    ON omop_vocab.relationship USING btree
    (relationship_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.relationship
    CLUSTER ON idx_relationship_rel_id;