export const SESSION_TABLE_NAME = 'auth_sessions';

export const CREATE_TABLE_STATEMENTS = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(26) PRIMARY KEY,
    account VARCHAR(191) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '正常',
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS ${SESSION_TABLE_NAME} (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    user_id VARCHAR(26) NULL,
    expires_at DATETIME NULL,
    last_activity_at DATETIME NULL,
    ip VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_auth_sessions_user_id (user_id),
    KEY idx_auth_sessions_expires_at (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS prompt_modules (
    code VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS prompt_versions (
    record_id VARCHAR(26) PRIMARY KEY,
    module_code VARCHAR(32) NOT NULL,
    version_label VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL,
    content LONGTEXT NOT NULL,
    created_by VARCHAR(26) NULL,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_prompt_module_version (module_code, version_label),
    KEY idx_prompt_versions_module_status (module_code, status),
    CONSTRAINT fk_prompt_versions_module FOREIGN KEY (module_code) REFERENCES prompt_modules (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS research_documents (
    id VARCHAR(26) PRIMARY KEY,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    file_ext VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    business_line VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL DEFAULT '未知对象',
    extracted_text LONGTEXT NOT NULL,
    analysis_result JSON NULL,
    prompt_module_code VARCHAR(32) NOT NULL DEFAULT '用户研究',
    prompt_version_id VARCHAR(26) NULL,
    prompt_version_label VARCHAR(32) NULL,
    llm_provider VARCHAR(64) NULL,
    llm_model VARCHAR(128) NULL,
    uploaded_by VARCHAR(26) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    analyzed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_documents_business_line_name (business_line, original_file_name),
    KEY idx_documents_uploaded_by (uploaded_by),
    KEY idx_documents_prompt_module (prompt_module_code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR(26) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    business_line VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL,
    issue VARCHAR(100) NOT NULL,
    feedback_text LONGTEXT NOT NULL,
    source_voice LONGTEXT NOT NULL,
    ai_evaluation LONGTEXT NOT NULL,
    ai_suggestion LONGTEXT NOT NULL,
    source_document_id VARCHAR(26) NULL,
    created_by VARCHAR(26) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_feedbacks_module_business_line (module, business_line),
    KEY idx_feedbacks_document (source_document_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS todos (
    id BIGINT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    content VARCHAR(500) NOT NULL,
    mentions INT NOT NULL DEFAULT 1,
    dept VARCHAR(50) NOT NULL,
    progress_text VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    source_module VARCHAR(50) NULL,
    source_document_id VARCHAR(26) NULL,
    source_document_name_snapshot VARCHAR(255) NULL,
    source_business_line_snapshot VARCHAR(50) NULL,
    created_by VARCHAR(26) NOT NULL,
    updated_by VARCHAR(26) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_todos_status (status),
    KEY idx_todos_type_dept (type, dept)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS legacy_import_batches (
    id VARCHAR(26) PRIMARY KEY,
    payload_hash VARCHAR(64) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    imported_by VARCHAR(26) NOT NULL,
    summary JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
] as const;
