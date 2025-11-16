import React from 'react';
import styles from './DataTable.module.css';

export default function DataTable({ data, columns, maxHeight = 400 }) {
  return (
    <div className={styles.dataTable}>
      <div className={styles.tableContainer} style={{ maxHeight }}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {columns.map(column => (
                <th key={column.key} className={styles.th}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {data.map((row, index) => (
              <tr key={row.id || index} className={styles.tr}>
                {columns.map(column => (
                  <td key={column.key} className={styles.td}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {data.length === 0 && (
          <div className={styles.noData}>
            <div className={styles.noDataIcon}>📊</div>
            <p className={styles.noDataText}>No data available</p>
            <p className={styles.noDataSubtext}>Try adjusting your filters or time range</p>
          </div>
        )}
      </div>
      
      {data.length > 0 && (
        <div className={styles.tableFooter}>
          <span className={styles.rowCount}>
            Showing {data.length} {data.length === 1 ? 'record' : 'records'}
          </span>
        </div>
      )}
    </div>
  );
}