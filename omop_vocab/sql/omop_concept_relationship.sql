-- Table: omop_vocab.concept_relationship

-- DROP TABLE IF EXISTS omop_vocab.concept_relationship;

CREATE TABLE IF NOT EXISTS omop_vocab.concept_relationship
(
    concept_id_1 integer NOT NULL,
    concept_id_2 integer NOT NULL,
    relationship_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    valid_start_date date NOT NULL,
    valid_end_date date NOT NULL,
    invalid_reason character varying(1) COLLATE pg_catalog."default"
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_relationship
    OWNER to postgres;
-- Index: idx_concept_relationship_id_1

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_relationship_id_1;

CREATE INDEX IF NOT EXISTS idx_concept_relationship_id_1
    ON omop_vocab.concept_relationship USING btree
    (concept_id_1 ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_relationship
    CLUSTER ON idx_concept_relationship_id_1;
-- Index: idx_concept_relationship_id_2

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_relationship_id_2;

CREATE INDEX IF NOT EXISTS idx_concept_relationship_id_2
    ON omop_vocab.concept_relationship USING btree
    (concept_id_2 ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_concept_relationship_id_3

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_relationship_id_3;

CREATE INDEX IF NOT EXISTS idx_concept_relationship_id_3
    ON omop_vocab.concept_relationship USING btree
    (relationship_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;