-- Table: omop_vocab.concept

-- DROP TABLE IF EXISTS omop_vocab.concept;

CREATE TABLE IF NOT EXISTS omop_vocab.concept
(
    concept_id integer NOT NULL,
    concept_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    domain_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    vocabulary_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    concept_class_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    standard_concept character varying(1) COLLATE pg_catalog."default",
    concept_code character varying(50) COLLATE pg_catalog."default" NOT NULL,
    valid_start_date date NOT NULL,
    valid_end_date date NOT NULL,
    invalid_reason character varying(1) COLLATE pg_catalog."default"
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept
    OWNER to postgres;
-- Index: idx_concept_class_id

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_class_id;

CREATE INDEX IF NOT EXISTS idx_concept_class_id
    ON omop_vocab.concept USING btree
    (concept_class_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_concept_code

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_code;

CREATE INDEX IF NOT EXISTS idx_concept_code
    ON omop_vocab.concept USING btree
    (concept_code COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_concept_concept_id

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_concept_id;

CREATE INDEX IF NOT EXISTS idx_concept_concept_id
    ON omop_vocab.concept USING btree
    (concept_id ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept
    CLUSTER ON idx_concept_concept_id;
-- Index: idx_concept_domain_id

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_domain_id;

CREATE INDEX IF NOT EXISTS idx_concept_domain_id
    ON omop_vocab.concept USING btree
    (domain_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_concept_vocabluary_id

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_vocabluary_id;

CREATE INDEX IF NOT EXISTS idx_concept_vocabluary_id
    ON omop_vocab.concept USING btree
    (vocabulary_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;