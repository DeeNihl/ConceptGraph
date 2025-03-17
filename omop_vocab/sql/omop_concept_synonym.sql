-- Table: omop_vocab.concept_synonym

-- DROP TABLE IF EXISTS omop_vocab.concept_synonym;

CREATE TABLE IF NOT EXISTS omop_vocab.concept_synonym
(
    concept_id integer NOT NULL,
    concept_synonym_name character varying(1000) COLLATE pg_catalog."default" NOT NULL,
    language_concept_id integer NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_synonym
    OWNER to postgres;
-- Index: idx_concept_synonym_id

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_synonym_id;

CREATE INDEX IF NOT EXISTS idx_concept_synonym_id
    ON omop_vocab.concept_synonym USING btree
    (concept_id ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_synonym
    CLUSTER ON idx_concept_synonym_id;